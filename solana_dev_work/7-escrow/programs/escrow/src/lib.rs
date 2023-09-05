use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer as SplTransfer};

declare_id!("B6vhiae1UkbsLQnTsZf86qG2su3jJcBT4ZzQuewByMbW");

#[program]
pub mod escrow {
  use super::*;
  
  pub fn initialize(ctx: Context<InitializeEscrow>, amount: u64) -> Result<()> {
    // Validation: Check if the amount is above a minimum threshold
    if amount < 10 {
      return Err(ErrorCode::AmountTooSmall.into());
    }
    
    // Step 1: Store Important Information
    // Fill out the important fields in the EscrowAccount
    let escrow = &mut ctx.accounts.escrow;
    escrow.mint = *ctx.accounts.mint.key;
    escrow.expected_amount = amount;
    escrow.initializer = *ctx.accounts.user.key;
    
    // Step 2: Set Initial State
    // Mark the escrow as not completed (initial)
    escrow.is_completed = false;
    
    Ok(())
  }
  
  pub fn transfer_to_escrow(ctx: Context<TransferToEscrow>, amount: u64) -> Result<()> {
    // Step 1: Perform Validations
    let escrow = &mut ctx.accounts.escrow;
    if escrow.initializer != *ctx.accounts.user.key {
      return Err(ErrorCode::Unauthorized.into());
    }
    
    // Step 2: Execute the Token Transfer
    // Use the SPL Token program to transfer tokens from user to escrow
    let cpi_accounts = SplTransfer {
      from: ctx.accounts.user_token_account.to_account_info(),
      to: ctx.accounts.temp_token_account.to_account_info(),
      authority: ctx.accounts.user.to_account_info()
    };
    
    let cpi_program = ctx.accounts.token_program.clone();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;
    
    // Step 3: Update State
    // Mark that the escrow has received the tokens
    escrow.initializer_received_tokens = true;
    
    Ok(())
  }
  
  pub fn release_tokens(ctx: Context<ReleaseTokens>, amount: u64) -> Result<()> {
    // Step 1: Perform Validations
    // Validate if the user is the initializer of the escrow
    let escrow = &mut ctx.accounts.escrow;
    if escrow.initializer != *ctx.accounts.user.key {
      return Err(ErrorCode::Unauthorized.into());
    }
    
    // Validate if the escrow is ready for release
    if !escrow.is_completed {
      return Err(ErrorCode::EscrowNotReadyForRelease.into());
    }
    
    // Step 2: Execute the Token Transfer
    // Use the SPL Token program to transfer tokens from escrow to other party
    let cpi_accounts = SplTransfer {
      from: ctx.accounts.temp_token_account.to_account_info(),
      to: ctx.accounts.other_party.to_account_info(),
      authority: ctx.accounts.user.to_account_info()
    };
    
    let cpi_program = ctx.accounts.token_program.clone();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;
    
    // Step 3: Update State
    // Mark the escrow as completed
    escrow.is_completed = true;
    
    // Successfully released tokens and updated escrow state
    Ok(())
  }

  pub fn close_escrow(ctx: Context<CloseEscrow>) -> Result<()> {
    // Check if the escrow is empty before closing it
    if ctx.accounts.temp_token_account.amount != 0 {
      return Err(ErrorCode:: EscrowNotEmpty.into());
    }

    // Check if the owner of the escrow is the one trying to close it
    if ctx.accounts.escrow.initializer != *ctx.accounts.initializer.key {
      return Err(ErrorCode::Unauthorized.into());
    }

    // Successfully returned lamports back to user who initialized the escrow
    Ok(())
  }

  
}

#[account]
pub struct EscrowAccount {
  // The user who initialized the escrow
  pub initializer: Pubkey,
  
  // The SPL Token mint for tokens to be escrowed
  pub mint: Pubkey,
  
  // Temporary holding account for tokens
  pub temp_token_account: Pubkey,
  
  // Account to receive tokens when escrow is completed
  pub initializer_token_to_receive_account: Pubkey,
  
  // The amount of tokens the initializer expects to be sent
  pub expected_amount: u64,
  
  // Whether the initializer has received the tokens
  pub initializer_received_tokens: bool,
  
  // Whether the escrow has been completed
  pub is_completed: bool
}

#[account]
pub struct EscrowParty {
  pub user: Pubkey,
  pub token_account: Pubkey
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
  // The escrow account being initialized, payer is 'user'.
  // Required space = 104 bytes (approx).
  #[account(init, payer = user, space = 137)]
  pub escrow: Account<'info, EscrowAccount>,
  
  /// CHECK: The SPL Token mint for the tokens that will be escrowed.
  pub mint: AccountInfo<'info>,
  
  // The user initializing the escrow, also the payer for the escrow account.
  #[account(mut)]
  pub user: Signer<'info>,
  
  // The system program, used for creating new accounts.
  pub system_program: Program<'info, System>,
  
  // The SPL Token program, used for SPL token operations.
  pub token_program: AccountInfo<'info>
}

#[derive(Accounts)]
pub struct TransferToEscrow<'info> {
  #[account(mut)]
  pub escrow: Account<'info, EscrowAccount>,
  
  // SPL Token account that will temporarily hold the tokens
  #[account(mut)]
  pub temp_token_account: Account<'info, TokenAccount>,
  
  // User's SPL Token account for the same mint as temp_token_account
  pub user_token_account: Account<'info, TokenAccount>,
  
  // The user who is transferring the tokens
  #[account(mut)]
  pub user: Signer<'info>,
  
  // The SPL Token program, used for SPL token operations
  pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ReleaseTokens<'info> {
  #[account(mut)]
  pub escrow: Account<'info, EscrowAccount>,
  
  // SPL Token account that will temporarily hold the tokens
  #[account(mut)]
  pub temp_token_account: Account<'info, TokenAccount>,
  
  // Other party's token account (to transfer tokens from)
  pub other_party: Account<'info, EscrowParty>,
  
  // User's SPL Token account for the same mint as temp_token_account
  pub user_token_account: Account<'info, TokenAccount>,
  
  // The user who is transferring the tokens
  #[account(mut)]
  pub user: Signer<'info>,
  
  // The SPL Token program, used for SPL token operations
  pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CloseEscrow<'info> {
  #[account(mut, has_one = initializer, close = initializer)]
  pub escrow: Account<'info, EscrowAccount>,
  
  // User's SPL Token account for the same mint as temp_token_account
  pub user_token_account: Account<'info, TokenAccount>,

  // SPL Token account that temporarily holds the tokens
  #[account(mut)]
  pub temp_token_account: Account<'info, TokenAccount>,

  // The user who is closing the escrow
  #[account(mut)]
  pub initializer: Signer<'info>,

  // The SPL Token program, used for SPL token operations
  pub token_program: AccountInfo<'info>
}

#[error_code]
pub enum ErrorCode {
  #[msg("The amount is too small to initialize the escrow.")]
  AmountTooSmall,
  #[msg("You are not authorized to perform this action.")]
  Unauthorized,
  #[msg("The amount does not match expected funds.")]
  AmountMismatch,
  #[msg("Escrow is not ready for release.")]
  EscrowNotReadyForRelease,
  #[msg("Cannot close escrow. Escrow is not empty.")]
  EscrowNotEmpty
}
use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer as SplTransfer};

declare_id!("14mG4C5w4S6YL4wNsRoUfbZ1quhQUjAtq98caTGYuWEs");

#[program]
pub mod wba_vault_spl {
  use super::*;
  
  pub fn initialize(ctx: Context<Initialize>, mint_address: Pubkey) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.owner  = *ctx.accounts.user.key;
    vault.mint = mint_address;
    vault.amount  = 0; // Initialize the amount to zero
    
    Ok(())
  }
  
  pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    // Check if the deposit amount is zero (we don't want this)
    if amount == 0 {
      return Err(ErrorCode::InvalidAmount.into());
    }
    // Check if the source SPL token account has enough tokens for the deposit
    if ctx.accounts.source.amount < amount {
      return Err(ErrorCode::InsufficientFunds.into());
    }
    
    // Transfer tokens from source to vault
    let cpi_accounts = SplTransfer {
      from: ctx.accounts.source.to_account_info(),
      to: ctx.accounts.vault.to_account_info(), 
      authority: ctx.accounts.owner.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.clone();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;
    
    // Update the `amount` field in the `vault` account to reflect the newly deposited SPL tokens
    ctx.accounts.vault.amount = ctx.accounts.vault.amount.checked_add(amount).ok_or(ErrorCode::AmountOverflow)?;
    
    Ok(())
  }
  
  pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // Check if the vault has enough tokens to allow the withdrawal
    if ctx.accounts.vault.amount < amount {
      return Err(ErrorCode::InsufficientFunds.into());
    }
    
    // Transfer tokens from vault to destination
    let cpi_accounts = SplTransfer {
      from: ctx.accounts.vault.to_account_info(),
      to: ctx.accounts.destination.to_account_info(),
      authority: ctx.accounts.owner.to_account_info()
    };
    
    let cpi_program = ctx.accounts.token_program.clone();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;
    
    // Update the `amount` field in the `vault` account to reflect the newly withdrawn SPL tokens
    ctx.accounts.vault.amount = ctx.accounts.vault.amount.checked_sub(amount).ok_or(ErrorCode::AmountOverflow)?;
    
    Ok(())
  }
  
  pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
    // Check if the vault is empty before closing it
    if ctx.accounts.vault.amount != 0 {
      return Err(ErrorCode::VaultNotEmpty.into());
    }
    
    // Check if the owner of the vault is the one trying to close it
    if ctx.accounts.vault.owner != *ctx.accounts.owner.key {
      return Err(ErrorCode::Unauthorized.into());
    }
    
    // Successfully returned lamports back to owner of the vault
    Ok(())
  }
  
}

#[account]
pub struct SplVault {
  pub owner: Pubkey,
  pub mint: Pubkey,
  pub amount: u64
}

#[derive(Accounts)]
pub struct Initialize<'info> {
  #[account(init, payer = user, space = 165)]
  pub vault: Account<'info, SplVault>,
  /// CHECK: No specific checks needed as this is a general-purpose token account.
  pub mint: AccountInfo<'info>,
  #[account(mut)]
  pub user: Signer<'info>,
  pub system_program: Program<'info, System>,
  /// CHECK: No specific checks needed as this is a general-purpose token account.
  pub token_program: AccountInfo<'info>
}

#[derive(Accounts)]
pub struct Deposit<'info> {
  #[account(mut, has_one = owner)]
  pub vault: Account<'info, SplVault>,
  #[account(mut)]
  pub source: Account<'info, TokenAccount>,
  #[account(mut)]
  pub owner: Signer<'info>,
  /// CHECK: No specific checks needed as this is a general-purpose token account.
  pub token_program: AccountInfo<'info>
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
  #[account(mut, has_one = owner)]
  pub vault: Account<'info, SplVault>,
  #[account(mut)]
  pub destination: Account<'info, TokenAccount>,
  #[account(mut)]
  pub owner: Signer<'info>,
  /// CHECK: No specific checks needed as this is a general-purpose token account.
  pub token_program: AccountInfo<'info>
}

#[derive(Accounts)]
pub struct CloseVault<'info> {
  #[account(mut, has_one = owner, close = owner)]
  pub vault: Account<'info, SplVault>,
  #[account(mut)]
  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[error_code] 
pub enum ErrorCode {
  #[msg("You are not authorized to perform this action.")]
  Unauthorized,
  #[msg("Insufficient funds.")]
  InsufficientFunds,
  #[msg("Invalid amount.")]
  InvalidAmount,
  #[msg("The provided amount overflows the vault's storage.")]
  AmountOverflow,
  #[msg("Cannot close vault. Vault is not empty.")]
  VaultNotEmpty
}
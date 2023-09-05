use anchor_lang::prelude::*;

declare_id!("9vfAn6egivddx287jm3P9hk7TMkGcshyfwyahSmq6UhT");

#[program]
pub mod wba_vault {
  use super::*;
  
  pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.vault.owner = ctx.accounts.user.key();
    ctx.accounts.vault.amount = 0;
    Ok(())
  }
  
  pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    // Check ownership between public key of `owner` and `vault`
    if ctx.accounts.vault.owner != ctx.accounts.owner.key() {
      return Err(ErrorCode::Unauthorized.into());
    }

    ctx.accounts.vault.amount += amount;
    
    Ok(())
  }

  pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // Check ownership between public key of `owner` and `vault`
    if ctx.accounts.vault.owner != ctx.accounts.owner.key() {
      return Err(ErrorCode::Unauthorized.into());
    }

    // Check for underflow
    let new_amount = ctx.accounts.vault.amount.checked_sub(amount).ok_or(ErrorCode::InsufficientFunds)?;

    ctx.accounts.vault.amount = new_amount;

    Ok(())  
  }

}

#[account]  
pub struct Vault {
  pub owner: Pubkey,
  pub amount: u64
}

#[derive(Accounts)]
pub struct Initialize<'info> { 
  #[account(init, payer = user, space = 8 + 8)]
  pub vault: Account<'info, Vault>,
  #[account(mut)]
  pub user: Signer<'info>,  
  pub system_program: Program<'info, System> 
}  

#[derive(Accounts)]
pub struct Deposit<'info> {
  #[account(mut)]
  pub vault: Account<'info, Vault>,
  /// CHECK: No specific checks needed as this is a general-purpose token account.
  pub token_account: AccountInfo<'info>,
  pub owner: Signer<'info>
}  

#[derive(Accounts)]
pub struct Withdraw<'info> {
  #[account(mut)]
  pub vault: Account<'info, Vault>,
  /// CHECK: No specific checks needed as this is a general-purpose token account.
  pub token_account: AccountInfo<'info>,
  pub owner: Signer<'info>
}

#[error_code] 
pub enum ErrorCode {
  #[msg("You are not authorized to perform this action.")]
  Unauthorized,
  #[msg("Insufficient funds.")]  
  InsufficientFunds
}
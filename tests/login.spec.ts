import { test, expect, Page } from '@playwright/test';

async function gotoLoginPage(page: Page) {
  await page.goto('auth/login?form');
  await expect(page).toHaveURL(/\/auth\/login/);
}

async function submitLoginForm(page: Page, membershipNumber: string, password: string) {
  if (membershipNumber) await page.fill('#membershipNumber', membershipNumber);
  if (password)         await page.fill('#password', password);
  await page.click('#login-btn');
}

test.describe('ログイン画面 (A101) - 状態遷移テスト', () => {

  test.beforeEach(async ({ page }) => {
    await gotoLoginPage(page);
  });

  // TC-L-001: 正常ログイン
  // カバレッジアイテム T1：未ログイン → [入力情報が正しい] → ログイン済み
  test('TC-L-001: 正常ログイン', async ({ page }) => {
    await submitLoginForm(page, '0000000001', 'aaaaa11111');
    await expect(page).toHaveURL(/\/ticket\/search/);
    await expect(page.getByText('ようこそ')).toBeVisible();
  });

  // TC-L-002: クライアントエラー（会員番号 未入力）
  // カバレッジアイテム T2：未ログイン → [入力情報に誤りあり] → 未ログイン
  test('TC-L-002: クライアントエラー（会員番号 未入力）', async ({ page }) => {
    await submitLoginForm(page, '', 'aaaaa11111');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText('入力必須項目です。')).toBeVisible();
  });

  // TC-L-003: クライアントエラー（パスワード 未入力）
  // カバレッジアイテム T2：未ログイン → [入力情報に誤りあり] → 未ログイン
  test('TC-L-003: クライアントエラー（パスワード 未入力）', async ({ page }) => {
    await submitLoginForm(page, '0000000001', '');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText('入力必須項目です。')).toBeVisible();
  });

  // TC-L-004: 認証エラー（会員番号 不存在）
  // カバレッジアイテム T3：未ログイン → [会員番号なし / パスワード誤り] → 未ログイン
  test('TC-L-004: 認証エラー（会員番号 不存在）', async ({ page }) => {
    await submitLoginForm(page, '9999999999', 'aaaaa11111');
    await expect(page).toHaveURL(/\/auth\/dologin/);
    await expect(page.locator('.alert')).toBeVisible();
  });

  // TC-L-005: 認証エラー（パスワード 不一致）
  // カバレッジアイテム T3：未ログイン → [会員番号なし / パスワード誤り] → 未ログイン
  test('TC-L-005: 認証エラー（パスワード 不一致）', async ({ page }) => {
    await submitLoginForm(page, '0000000001', 'wrongpasswd');
    await expect(page).toHaveURL(/\/auth\/dologin/);
    await expect(page.locator('.alert')).toBeVisible();
  });
});

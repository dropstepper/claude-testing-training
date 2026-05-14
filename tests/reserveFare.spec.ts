import { test, expect } from '@playwright/test';

function parseFare(text: string): number {
  return parseInt(text.replace(/[¥,\s]/g, ''), 10);
}

function boardingDateString(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

test('TC-R-001: 子供料金の適用確認', async ({ page }) => {
  // 1. ログインして空席照会画面（B101）に遷移する
  await page.goto('auth/login?form');
  await page.fill('#membershipNumber', '0000000001');
  await page.fill('#password', 'aaaaa11111');
  await page.click('#login-btn');
  await expect(page).toHaveURL(/\/ticket\/search/);

  // 2. 出発地「東京（羽田）」・到着地「大阪（伊丹）」・片道・7日後の日付で照会する
  await page.selectOption('#depAirportCd', { label: '東京(羽田)' });
  await page.selectOption('#arrAirportCd', { label: '大阪(伊丹)' });
  await page.check('input[name="flightType"][value="OW"]');
  await page.check('input[name="boardingClassCd"][value="N"]');
  await page.fill('#outwardDate', boardingDateString());
  await page.dispatchEvent('#outwardDate', 'change');
  await page.click('#flights-search-button');

  // 3. 検索結果から最初のフライトを選択し「選択フライトを予約」ボタンを押す
  // フライト一覧はAJAXで取得されるため、表示完了まで待機する
  await expect(page.locator('#outward-flights')).toBeVisible({ timeout: 10_000 });
  const firstFlight = page.locator('input[name="outward-flight-select"]').first();
  await expect(firstFlight).toBeEnabled({ timeout: 10_000 });
  await firstFlight.check();
  await page.click('#reserve-flights-button');

  // ログイン済みのためB202（お客様情報入力画面）に直接遷移する
  await expect(page.locator('h2:has-text("予約")')).toBeVisible();

  // 4. 「搭乗者を追加」ボタンを押して搭乗者2の入力欄を表示する
  await page.click('#add-passenger-button');
  await expect(page.locator('#passenger2')).toBeVisible();

  // 5. 搭乗者2に名前（カタカナ）・年齢「5」・性別「男性」を入力する
  await page.fill('[name="passengerFormList[1].familyName"]', 'テスト');
  await page.fill('[name="passengerFormList[1].givenName"]', 'コドモ');
  await page.fill('[name="passengerFormList[1].age"]', '5');
  await page.check('[name="passengerFormList[1].gender"][value="M"]');

  // 6. 「予約確認」ボタンを押してB203（申し込み内容確認画面）に遷移する
  await page.click('input[name="confirm"]');
  await expect(page.locator('h2:has-text("予約内容確認")')).toBeVisible();

  // 7. B203で金額を取得して確認する

  // フライト情報一覧から大人1名分の運賃を取得する（運賃列 = テーブル最終列）
  // h3 + table の隣接セレクタで flights テーブルのみに絞り込む
  const adultFareText = await page
    .locator('h3:has-text("選択フライト") + table tbody tr:first-child td:last-child')
    .textContent();
  const adultFare = parseFare(adultFareText ?? '');

  // 合計金額を取得する
  // h3 + p の隣接セレクタで合計金額のpのみに絞り込む
  const totalFareText = await page
    .locator('h3:has-text("合計金額") + p')
    .textContent();
  const totalFare = parseFare(totalFareText ?? '');

  // 合計金額が「大人運賃 × 2」より少ないことを確認する
  // 子供料金（5歳）は大人料金より安いため、大人2名分の合計より小さくなるはず
  expect(totalFare).toBeLessThan(adultFare * 2);
});

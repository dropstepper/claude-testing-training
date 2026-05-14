import { test, expect } from '@playwright/test';

function parseFare(text: string): number {
  // U+00A5 (&yen;) および U+FFE5（全角円記号）、カンマ、空白を除去
  return parseInt(text.replace(/[¥￥,\s]/g, ''), 10);
}

function getDateString(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

test.use({ baseURL: 'http://localhost:8083/atrs/' });

test.describe('予約フロー - 運賃算出検証', () => {

  // TC-R-001: 子供料金の適用確認
  // 大人1名 + 子供(5歳)1名の合計金額が、大人2名分の運賃より安いことを検証する
  test('TC-R-001: 子供料金の適用確認', async ({ page }) => {

    // Step 1: ログイン → 空席照会画面へ
    await page.goto('auth/login?form');
    await page.fill('#membershipNumber', '0000000001');
    await page.fill('#password', 'aaaaa11111');
    await page.click('#login-btn');
    await expect(page).toHaveURL(/\/ticket\/search/);

    // Step 2: 出発地「東京（羽田）」・到着地「大阪（伊丹）」・片道・7日後で検索
    await page.locator('label.radio-inline').filter({ hasText: '片道' }).locator('input').check();
    await page.selectOption('[name="depAirportCd"]', { label: '東京(羽田)' });
    await page.selectOption('[name="arrAirportCd"]', { label: '大阪(伊丹)' });
    await page.fill('[name="outwardDate"]', getDateString(7));
    await page.locator('[name="boardingClassCd"]').first().check();
    await page.click('#flights-search-button');

    // Step 3: フライト一覧の表示を待機（Ajax ロード）→ 最初の空席あり運賃を選択 → 予約
    await expect(page.locator('[name="outward-flight-select"]:not([disabled])').first()).toBeVisible({ timeout: 10_000 });
    await page.locator('[name="outward-flight-select"]:not([disabled])').first().check();
    await page.click('#reserve-flights-button');

    // B202（お客様情報入力）への遷移を確認
    await expect(page.locator('#customerinfo-form')).toBeVisible();

    // Step 4: 搭乗者を追加
    await page.click('#add-passenger-button');
    await expect(page.locator('#passenger2')).toBeVisible();

    // Step 5: 搭乗者2に情報を入力（カタカナ名・年齢5・性別男性）
    await page.fill('[name="passengerFormList[1].familyName"]', 'ヤマダ');
    await page.fill('[name="passengerFormList[1].givenName"]', 'タロウ');
    await page.fill('[name="passengerFormList[1].age"]', '5');
    await page.locator('#passenger2 label.radio-inline').filter({ hasText: '男性' }).locator('input').check();

    // Step 6: 「予約確認」ボタン押下
    await page.getByRole('button', { name: '予約確認' }).click();

    // B203（申し込み内容確認）への遷移を確認
    await expect(page.locator('h2', { hasText: '予約内容確認' })).toBeVisible();

    // Step 7: 合計金額と大人運賃を取得して比較
    // 「選択フライト」テーブルの運賃列（最終td = 9列目）から大人1名分の運賃を取得
    const fareText = await page
      .locator('section')
      .filter({ has: page.locator('h3', { hasText: '選択フライト' }) })
      .locator('tbody tr')
      .first()
      .locator('td')
      .last()
      .textContent();

    // 「合計金額」セクションの p 要素から取得
    // section フィルタは外側の section にも一致するため、¥ を含む p に絞る
    const totalText = await page
      .locator('section')
      .filter({ has: page.locator('h3', { hasText: '合計金額' }) })
      .locator('p')
      .filter({ hasText: /¥/ })
      .textContent();

    const adultFare = parseFare(fareText!);
    const total = parseFare(totalText!);

    // 子供料金は大人より安いため、合計金額 < 大人運賃 × 2 になるはず
    expect(total).toBeLessThan(adultFare * 2);
  });
});

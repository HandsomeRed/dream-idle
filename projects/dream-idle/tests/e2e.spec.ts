import { test, expect } from '@playwright/test';

test.describe('梦幻放置 - 角色创建流程', () => {
  test('完整的角色创建流程', async ({ page }) => {
    // 访问应用
    await page.goto('http://localhost:5173');

    // 1. 验证初始界面
    await expect(page.getByText('🎮 梦幻放置')).toBeVisible();
    await expect(page.getByText('创建你的角色')).toBeVisible();
    
    // 2. 输入角色名字
    await page.getByTestId('name-input').fill('测试少侠');
    
    // 3. 点击下一步
    await page.getByTestId('next-button').click();
    
    // 4. 验证门派选择界面
    await expect(page.getByText('🎭 选择门派')).toBeVisible();
    await expect(page.getByTestId('job-剑侠客')).toBeVisible();
    await expect(page.getByTestId('job-骨精灵')).toBeVisible();
    await expect(page.getByTestId('job-龙太子')).toBeVisible();
    await expect(page.getByTestId('job-狐美人')).toBeVisible();
    
    // 5. 选择门派
    await page.getByTestId('job-剑侠客').click();
    
    // 6. 验证角色创建成功
    await expect(page.getByText('✨ 角色创建成功！')).toBeVisible();
    await expect(page.getByText('测试少侠')).toBeVisible();
    await expect(page.getByText('剑侠客')).toBeVisible();
    await expect(page.getByText('Lv.1')).toBeVisible();
    
    // 7. 点击开始游戏按钮
    await page.getByTestId('start-game-btn').click();
    
    // 8. 验证弹出提示
    await expect(page.locator('text=游戏开始！(功能开发中...)')).toBeVisible();
    
    // 9. 关闭 alert
    await page.evaluate(() => {
      window.addEventListener('dialog', dialog => dialog.dismiss());
    });
  });

  test('返回按钮功能', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 输入名字并进入门派选择
    await page.getByTestId('name-input').fill('少侠');
    await page.getByTestId('next-button').click();
    
    // 点击返回
    await page.getByText('← 返回').click();
    
    // 验证回到初始界面
    await expect(page.getByText('🎮 梦幻放置')).toBeVisible();
  });

  test('名字为空时按钮禁用', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // 验证下一步按钮初始状态是禁用
    const nextButton = page.getByTestId('next-button');
    await expect(nextButton).toBeDisabled();
  });
});

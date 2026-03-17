import React, { useState } from 'react';

interface UpdateEntry {
  date: string;
  version: string;
  features: string[];
  tests: string;
  knowledge: string[];
}

const updateData: UpdateEntry[] = [
  {
    date: '2026-03-18',
    version: 'v0.17.0',
    features: [
      '✅ 推图系统实现（10 章 100 关）',
      '✅ 关卡选择界面（章节切换）',
      '✅ 关卡战斗界面（回合制动画）',
      '✅ 星级评价系统（1-3 星）',
      '✅ 进度保存 + 首通奖励',
      '✅ 18 个单元测试，100% 通过率'
    ],
    tests: '174/174 通过',
    knowledge: [
      '放置游戏推图系统设计',
      '关卡难度曲线设计',
      '星级评价系统实现'
    ]
  },
  {
    date: '2026-03-18',
    version: 'v2.0 重新设计',
    features: [
      '🔄 删除所有社交系统（8 个文件）',
      '📝 重新设计文档（DESIGN.md）',
      '🎯 专注单机放置玩法',
      '💡 核心理念：推图 + 养成 + 离线'
    ],
    tests: '代码重构完成',
    knowledge: [
      '游戏类型定位分析',
      '单机 vs 网游设计差异',
      '放置游戏核心循环设计'
    ]
  },
  {
    date: '2026-03-12',
    version: 'v0.2.0',
    features: [
      '✅ 属性系统实现（力量/敏捷/智力/体力）',
      '✅ 数值计算公式（生命/魔法/攻击/防御）',
      '✅ 属性点分配功能',
      '✅ 23 个单元测试，100% 通过率'
    ],
    tests: '23/23 通过',
    knowledge: [
      '放置游戏设计理论',
      '数值设计公式',
      '属性系统架构'
    ]
  },
  {
    date: '2026-03-12',
    version: 'v0.1.0',
    features: [
      '✅ 角色创建系统',
      '✅ 角色数据接口定义',
      '✅ 表单验证',
      '✅ 8 个单元测试，100% 通过率'
    ],
    tests: '8/8 通过',
    knowledge: [
      '角色创建系统实现'
    ]
  }
];

export function UpdateLog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 更新记录按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all z-50 font-semibold"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        更新记录
      </button>

      {/* 更新记录弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col border-2 border-gray-300">
            {/* 头部 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">🎮 DreamIdle 更新记录</h2>
                <p className="text-blue-100 mt-1">梦幻西游题材放置挂机游戏</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 统计概览 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-100 rounded-lg p-4 text-center border-2 border-blue-300">
                  <div className="text-2xl font-bold text-blue-800">4</div>
                  <div className="text-sm text-gray-800">版本完成</div>
                </div>
                <div className="bg-green-100 rounded-lg p-4 text-center border-2 border-green-300">
                  <div className="text-2xl font-bold text-green-800">174/174</div>
                  <div className="text-sm text-gray-800">测试通过</div>
                </div>
                <div className="bg-purple-100 rounded-lg p-4 text-center border-2 border-purple-300">
                  <div className="text-2xl font-bold text-purple-800">6 篇</div>
                  <div className="text-sm text-gray-800">知识沉淀</div>
                </div>
              </div>

              {/* 更新记录时间线 */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b-2 border-blue-500 pb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  更新历史
                </h3>

                {updateData.map((update, index) => (
                  <div key={index} className="border-l-4 border-blue-600 pl-4 py-2 bg-gray-50 rounded-r-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {update.version}
                      </span>
                      <span className="text-gray-700 text-sm font-semibold">{update.date}</span>
                    </div>

                    {/* 功能列表 */}
                    <div className="space-y-2 mb-3">
                      {update.features.map((feature, i) => (
                        <div key={i} className="text-gray-900 text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-0.5 font-bold">✓</span>
                          <span className="font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* 测试通过 */}
                    <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2 mb-3">
                      <div className="text-sm text-green-900">
                        <span className="font-bold">🧪 测试：</span>
                        <span className="font-mono font-bold">{update.tests}</span>
                      </div>
                    </div>

                    {/* 知识沉淀 */}
                    <div className="bg-purple-100 border border-purple-300 rounded-lg px-3 py-2">
                      <div className="text-sm text-purple-900 mb-2 font-bold">
                        📚 知识沉淀：
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {update.knowledge.map((item, i) => (
                          <span key={i} className="bg-purple-200 text-purple-900 px-2 py-1 rounded text-xs font-semibold">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 下一步计划 */}
              <div className="mt-8 pt-6 border-t-2 border-gray-300">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  下一步计划 (v0.18)
                </h3>
                <div className="space-y-2">
                  <div className="text-gray-900 text-sm flex items-start gap-2">
                    <span className="text-orange-600">○</span>
                    <span className="font-medium">离线收益系统（按推图进度计算）</span>
                  </div>
                  <div className="text-gray-900 text-sm flex items-start gap-2">
                    <span className="text-orange-600">○</span>
                    <span className="font-medium">装备系统重构（掉落/强化/升星）</span>
                  </div>
                  <div className="text-gray-900 text-sm flex items-start gap-2">
                    <span className="text-orange-600">○</span>
                    <span className="font-medium">技能系统重构（升级/搭配）</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部 */}
            <div className="bg-gray-100 px-6 py-4 border-t-2 border-gray-300 flex justify-between items-center">
              <div className="text-sm text-gray-800 font-medium">
                📁 项目路径：<code className="bg-white border border-gray-300 px-2 py-1 rounded text-xs font-mono">
                  ~/.openclaw/workspace/projects/dream-idle
                </code>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

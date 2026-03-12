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
        className="fixed top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all z-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        学习记录
      </button>

      {/* 更新记录弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* 头部 */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">🎮 DreamIdle 学习记录</h2>
                <p className="text-blue-100 mt-1">虾虾红的游戏开发实践</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
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
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">2</div>
                  <div className="text-sm text-gray-600">版本完成</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">31/31</div>
                  <div className="text-sm text-gray-600">测试通过</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">4 篇</div>
                  <div className="text-sm text-gray-600">知识沉淀</div>
                </div>
              </div>

              {/* 更新记录时间线 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  开发记录
                </h3>

                {updateData.map((update, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {update.version}
                      </span>
                      <span className="text-gray-500 text-sm">{update.date}</span>
                    </div>

                    {/* 功能列表 */}
                    <div className="space-y-2 mb-3">
                      {update.features.map((feature, i) => (
                        <div key={i} className="text-gray-700 text-sm flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* 测试通过 */}
                    <div className="bg-green-50 rounded-lg px-3 py-2 mb-3">
                      <div className="text-sm text-green-800">
                        <span className="font-semibold">测试：</span>
                        <span className="font-mono">{update.tests}</span>
                      </div>
                    </div>

                    {/* 知识沉淀 */}
                    <div className="bg-purple-50 rounded-lg px-3 py-2">
                      <div className="text-sm text-purple-800 mb-2 font-semibold">
                        📚 知识库更新：
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {update.knowledge.map((item, i) => (
                          <span key={i} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 明日计划 */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  明日计划 (v0.3)
                </h3>
                <div className="space-y-2">
                  <div className="text-gray-700 text-sm flex items-start gap-2">
                    <span className="text-orange-500">○</span>
                    <span>战斗系统实现</span>
                  </div>
                  <div className="text-gray-700 text-sm flex items-start gap-2">
                    <span className="text-orange-500">○</span>
                    <span>战斗界面 UI 设计</span>
                  </div>
                  <div className="text-gray-700 text-sm flex items-start gap-2">
                    <span className="text-orange-500">○</span>
                    <span>技能系统基础</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部 */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                📁 项目路径：<code className="bg-gray-200 px-2 py-1 rounded text-xs">
                  ~/.openclaw/workspace/projects/dream-idle
                </code>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
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

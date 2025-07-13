import React, { useState } from 'react';

export const DataExport: React.FC = () => {
  const [step] = useState(1);

  const exportScript = `
const data = {
  expenses: JSON.parse(localStorage.getItem('household-expenses') || '[]'),
  budgets: JSON.parse(localStorage.getItem('monthly-budgets') || '[]'),
  settings: JSON.parse(localStorage.getItem('app-settings') || '{}')
};

console.log('=== エクスポートデータ ===');
console.log(JSON.stringify(data, null, 2));
console.log('=== コピー用データ ===');
console.log(JSON.stringify(data));

if (navigator.clipboard) {
  navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
    console.log('データがクリップボードにコピーされました！');
  });
}
  `.trim();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportScript);
    alert('スクリプトがクリップボードにコピーされました！');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">データエクスポート手順</h1>
      
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">重要な注意事項</h2>
        <p className="text-blue-700">
          元のアプリ（https://kakeibo-app-q86dhqt7.devinapps.com/）のデータは、
          お客様のブラウザのlocalStorageに保存されています。
          このデータを新しいシステムに移行するには、以下の手順に従ってください。
        </p>
      </div>

      <div className="space-y-6">
        <div className={`p-6 border rounded-lg ${step >= 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${step >= 1 ? 'bg-blue-500' : 'bg-gray-400'}`}>
              1
            </div>
            <h3 className="text-xl font-semibold ml-3">元のアプリにアクセス</h3>
          </div>
          <p className="text-gray-700 mb-4">
            まず、元のアプリ（https://kakeibo-app-q86dhqt7.devinapps.com/）を
            新しいタブで開いてください。
          </p>
          <a 
            href="https://kakeibo-app-q86dhqt7.devinapps.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            元のアプリを開く
          </a>
        </div>

        <div className={`p-6 border rounded-lg ${step >= 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${step >= 2 ? 'bg-blue-500' : 'bg-gray-400'}`}>
              2
            </div>
            <h3 className="text-xl font-semibold ml-3">ブラウザの開発者ツールを開く</h3>
          </div>
          <p className="text-gray-700 mb-4">
            元のアプリのページで、以下のいずれかの方法で開発者ツールを開いてください：
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>F12キーを押す</li>
            <li>右クリック → 「検証」または「要素を調査」</li>
            <li>Ctrl+Shift+I（Windows）またはCmd+Option+I（Mac）</li>
          </ul>
        </div>

        <div className={`p-6 border rounded-lg ${step >= 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${step >= 3 ? 'bg-blue-500' : 'bg-gray-400'}`}>
              3
            </div>
            <h3 className="text-xl font-semibold ml-3">コンソールタブに移動</h3>
          </div>
          <p className="text-gray-700 mb-4">
            開発者ツールが開いたら、「Console」（コンソール）タブをクリックしてください。
          </p>
        </div>

        <div className={`p-6 border rounded-lg ${step >= 4 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${step >= 4 ? 'bg-blue-500' : 'bg-gray-400'}`}>
              4
            </div>
            <h3 className="text-xl font-semibold ml-3">エクスポートスクリプトを実行</h3>
          </div>
          <p className="text-gray-700 mb-4">
            以下のJavaScriptコードをコンソールにコピー＆ペーストして、Enterキーを押してください：
          </p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
            <pre>{exportScript}</pre>
          </div>
          <button 
            onClick={copyToClipboard}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            スクリプトをコピー
          </button>
        </div>

        <div className={`p-6 border rounded-lg ${step >= 5 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${step >= 5 ? 'bg-blue-500' : 'bg-gray-400'}`}>
              5
            </div>
            <h3 className="text-xl font-semibold ml-3">データをコピー</h3>
          </div>
          <p className="text-gray-700 mb-4">
            スクリプトを実行すると、コンソールにデータが表示されます。
            「=== コピー用データ ===」の下に表示される1行のJSONデータをコピーしてください。
          </p>
        </div>

        <div className="p-6 border border-green-500 bg-green-50 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-green-500">
              6
            </div>
            <h3 className="text-xl font-semibold ml-3">データをインポート</h3>
          </div>
          <p className="text-gray-700 mb-4">
            コピーしたデータを持って、データインポートページに移動してください。
          </p>
          <button 
            onClick={() => window.location.href = '/import'}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            インポートページへ移動
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">トラブルシューティング</h3>
        <ul className="list-disc list-inside text-yellow-700 space-y-1">
          <li>データが空の場合：元のアプリにログインしてからスクリプトを実行してください</li>
          <li>エラーが発生した場合：ページを再読み込みしてから再試行してください</li>
          <li>コンソールが見つからない場合：F12を押して開発者ツールを開き直してください</li>
        </ul>
      </div>
    </div>
  );
};

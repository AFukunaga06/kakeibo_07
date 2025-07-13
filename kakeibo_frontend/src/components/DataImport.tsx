import React, { useState } from 'react';
import { expenseService } from '../services/expenseService';

interface ImportData {
  expenses: any[];
  budgets: any[];
  settings?: any;
}

export const DataImport: React.FC = () => {
  const [importData, setImportData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ImportData | null>(null);

  const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setImportData(value);
    setError(null);
    setResult(null);
    
    if (value.trim()) {
      try {
        const parsed = JSON.parse(value);
        setPreviewData(parsed);
      } catch (err) {
        setPreviewData(null);
      }
    } else {
      setPreviewData(null);
    }
  };

  const transformExpenseData = (expenses: any[]): any[] => {
    return expenses.map(expense => ({
      amount: parseFloat(expense.amount) || 0,
      category: expense.category || '未分類',
      description: expense.description || '',
      date: expense.date ? new Date(expense.date).toISOString() : new Date().toISOString()
    }));
  };

  const transformBudgetData = (budgets: any[]): any[] => {
    return budgets.map(budget => ({
      year: parseInt(budget.year) || new Date().getFullYear(),
      month: parseInt(budget.month) || new Date().getMonth() + 1,
      budget_amount: parseFloat(budget.budget_amount) || 0
    }));
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      setError('インポートするデータを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const parsed: ImportData = JSON.parse(importData);
      
      const transformedExpenses = transformExpenseData(parsed.expenses || []);
      const transformedBudgets = transformBudgetData(parsed.budgets || []);

      const response = await expenseService.importData({
        expenses: transformedExpenses,
        budgets: transformedBudgets
      });

      setResult(response.message);
      setImportData('');
      setPreviewData(null);
    } catch (err: any) {
      if (err.message.includes('JSON')) {
        setError('無効なJSONデータです。正しい形式で入力してください。');
      } else {
        setError(`インポートに失敗しました: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      return;
    }

    setIsLoading(true);
    try {
      await expenseService.clearData();
      setResult('すべてのデータが削除されました');
    } catch (err: any) {
      setError(`データ削除に失敗しました: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">データインポート</h1>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">インポート手順</h2>
        <ol className="list-decimal list-inside text-blue-700 space-y-1">
          <li>元のアプリからエクスポートしたJSONデータを下のテキストエリアに貼り付けてください</li>
          <li>データのプレビューを確認してください</li>
          <li>「データをインポート」ボタンをクリックしてください</li>
        </ol>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="importData" className="block text-sm font-medium text-gray-700 mb-2">
            エクスポートしたJSONデータ
          </label>
          <textarea
            id="importData"
            value={importData}
            onChange={handleDataChange}
            placeholder='{"expenses": [...], "budgets": [...]} の形式でデータを貼り付けてください'
            className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
        </div>

        {previewData && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">データプレビュー</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">支出データ</h4>
                <p className="text-sm text-gray-600">
                  {previewData.expenses?.length || 0} 件の支出データ
                </p>
                {previewData.expenses?.slice(0, 3).map((expense, index) => (
                  <div key={index} className="text-xs text-gray-500 mt-1">
                    ¥{expense.amount} - {expense.category} - {expense.description}
                  </div>
                ))}
                {(previewData.expenses?.length || 0) > 3 && (
                  <div className="text-xs text-gray-500 mt-1">
                    ...他 {(previewData.expenses?.length || 0) - 3} 件
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">予算データ</h4>
                <p className="text-sm text-gray-600">
                  {previewData.budgets?.length || 0} 件の予算データ
                </p>
                {previewData.budgets?.slice(0, 3).map((budget, index) => (
                  <div key={index} className="text-xs text-gray-500 mt-1">
                    {budget.year}年{budget.month}月: ¥{budget.budget_amount}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{result}</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              家計簿アプリに戻る
            </button>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleImport}
            disabled={isLoading || !importData.trim() || !previewData}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'インポート中...' : 'データをインポート'}
          </button>
          
          <button
            onClick={handleClearData}
            disabled={isLoading}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            すべてのデータを削除
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">注意事項</h3>
        <ul className="list-disc list-inside text-yellow-700 space-y-1">
          <li>インポートする前に、既存のデータは削除されます</li>
          <li>データの形式が正しくない場合、インポートは失敗します</li>
          <li>大量のデータの場合、インポートに時間がかかる場合があります</li>
          <li>インポート後は、ブラウザを再読み込みしてデータを確認してください</li>
        </ul>
      </div>
    </div>
  );
};

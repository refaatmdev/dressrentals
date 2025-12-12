import { useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface CostCalculatorProps {
    costs: {
        fabricCost: number;
        jewelryCost: number;
        paddingCost: number;
        sewingCost: number;
        additionalCosts?: { name: string; amount: number }[];
        totalCost: number;
    };
    onChange: (costs: any) => void;
}

export const CostCalculator = ({ costs, onChange }: CostCalculatorProps) => {
    useEffect(() => {
        const fixedTotal =
            (Number(costs.fabricCost) || 0) +
            (Number(costs.jewelryCost) || 0) +
            (Number(costs.paddingCost) || 0) +
            (Number(costs.sewingCost) || 0);

        const additionalTotal = (costs.additionalCosts || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        const total = fixedTotal + additionalTotal;

        if (total !== costs.totalCost) {
            onChange({ ...costs, totalCost: total });
        }
    }, [costs.fabricCost, costs.jewelryCost, costs.paddingCost, costs.sewingCost, costs.additionalCosts]);

    const handleChange = (field: string, value: string) => {
        onChange({ ...costs, [field]: Number(value) });
    };

    const addCostItem = () => {
        const newCosts = [
            ...(costs.additionalCosts || []),
            { name: '', amount: 0 }
        ];
        onChange({ ...costs, additionalCosts: newCosts });
    };

    const removeCostItem = (index: number) => {
        const newCosts = [...(costs.additionalCosts || [])];
        newCosts.splice(index, 1);
        onChange({ ...costs, additionalCosts: newCosts });
    };

    const updateCostItem = (index: number, field: 'name' | 'amount', value: string | number) => {
        const newCosts = [...(costs.additionalCosts || [])];
        newCosts[index] = {
            ...newCosts[index],
            [field]: field === 'amount' ? Number(value) : value
        };
        onChange({ ...costs, additionalCosts: newCosts });
    };

    return (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-700 border-b border-gray-200 pb-2">מחשבון עלויות ייצור</h3>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">עלות בדים</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={costs.fabricCost || ''}
                            onChange={(e) => handleChange('fabricCost', e.target.value)}
                            className="w-full pl-2 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                            placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₪</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">תכשיטים/חרוזים</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={costs.jewelryCost || ''}
                            onChange={(e) => handleChange('jewelryCost', e.target.value)}
                            className="w-full pl-2 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                            placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₪</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">פדים/קאפים</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={costs.paddingCost || ''}
                            onChange={(e) => handleChange('paddingCost', e.target.value)}
                            className="w-full pl-2 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                            placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₪</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">תפירה</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={costs.sewingCost || ''}
                            onChange={(e) => handleChange('sewingCost', e.target.value)}
                            className="w-full pl-2 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                            placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₪</span>
                    </div>
                </div>
            </div>

            {/* Dynamic Costs */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-500">תוספות מיוחדות</label>
                {costs.additionalCosts?.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateCostItem(index, 'name', e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
                            placeholder="שם התוספת"
                        />
                        <div className="relative w-24">
                            <input
                                type="number"
                                value={item.amount || ''}
                                onChange={(e) => updateCostItem(index, 'amount', e.target.value)}
                                className="w-full pl-2 pr-6 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
                                placeholder="0"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₪</span>
                        </div>
                        <button
                            onClick={() => removeCostItem(index)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addCostItem}
                    className="text-xs text-gold hover:text-gold-dark font-medium flex items-center gap-1 mt-1"
                >
                    <Plus size={14} />
                    הוסף שורה
                </button>
            </div>

            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="font-bold text-gray-700">סה״כ עלות:</span>
                <span className="font-bold text-xl text-gold-dark">₪{costs.totalCost.toLocaleString()}</span>
            </div>
        </div>
    );
};

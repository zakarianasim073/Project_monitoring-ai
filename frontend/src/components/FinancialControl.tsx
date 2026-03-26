{/* Item-wise Actual Cost Analysis with 14.5% Govt Deduction */}
<div className="bg-white rounded-3xl border overflow-hidden">
  <div className="px-8 py-6 border-b bg-slate-50 flex justify-between">
    <h3 className="font-semibold text-xl">Item-wise Actual Costing & Profit/Loss</h3>
    <span className="text-sm text-rose-600 font-medium">14.5% Govt Deduction Applied on Quoted Rate</span>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-slate-50">
        <tr>
          <th className="px-6 py-4 text-left">Description</th>
          <th className="px-6 py-4 text-right">Quoted Rate</th>
          <th className="px-6 py-4 text-right">Actual Cost (M+L+E+O)</th>
          <th className="px-6 py-4 text-right text-rose-600">14.5% Govt Ded.</th>
          <th className="px-6 py-4 text-right font-semibold">Final Actual Cost</th>
          <th className="px-6 py-4 text-right">Profit/Loss per Unit</th>
          <th className="px-6 py-4 text-right">Total P/L (Executed Qty)</th>
          <th className="px-6 py-4 text-center">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {data.boq.map((item) => {
          const analysis = item.costAnalysis || {};
          const finalActual = analysis.unitCost || 0;
          const govtDed = item.rate * 0.145;
          const profitPerUnit = item.rate - finalActual;
          const totalPL = profitPerUnit * item.executedQty;

          return (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 font-medium">{item.description}</td>
              <td className="px-6 py-4 text-right">৳{item.rate.toLocaleString()}</td>
              <td className="px-6 py-4 text-right font-mono">
                ৳{(analysis.breakdown?.material || 0) + (analysis.breakdown?.labor || 0) + 
                   (analysis.breakdown?.equipment || 0) + (analysis.breakdown?.overhead || 0)}
              </td>
              <td className="px-6 py-4 text-right text-rose-600">৳{govtDed.toFixed(2)}</td>
              <td className="px-6 py-4 text-right font-bold">৳{finalActual.toFixed(2)}</td>
              <td className={`px-6 py-4 text-right font-bold ${profitPerUnit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ৳{profitPerUnit.toFixed(2)}
              </td>
              <td className={`px-6 py-4 text-right font-bold ${totalPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ৳{totalPL.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-center">
                <button 
                  onClick={() => analyzeCost(item.id)}
                  className="text-xs bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full hover:bg-indigo-200"
                >
                  AI Analyze Cost
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>

import { useState, useEffect } from 'react';

interface PriceRow {
  type: string;
  diameter: number;
  thickness: number;
  length: number;
  kg: number;
  rate: number;
  price: number;
}

interface FixedPrice {
  welding: number;
  expence: number;
  rubber: number;
}

export default function Price() {
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [material, setMaterial] = useState('STEEL');
  const [qty, setQty] = useState(1);
  const [dimensions, setDimensions] = useState('1350 x 1250 x 100 FD');
  
  const [rows, setRows] = useState<PriceRow[]>([
    { type: 'ROUND', diameter: 110, thickness: 0, length: 1360, kg: 101.41, rate: 85, price: 0 },
    { type: 'PIPE', diameter: 0, thickness: 0, length: 2110, kg: 0, rate: 75, price: 0 },
    { type: 'PLAT', diameter: 0, thickness: 0, length: 30, kg: 0, rate: 70, price: 0 },
    { type: 'PLATING', diameter: 100, thickness: 0, length: 1250, kg: 610, rate: 3, price: 0 },
    { type: 'GRINDING', diameter: 100, thickness: 0, length: 1350, kg: 659, rate: 2, price: 0 },
  ]);

  const [fixedPrices, setFixedPrices] = useState<FixedPrice>({
    welding: 1500,
    expence: 1000,
    rubber: 500
  });

  const [expenceQty, setExpenceQty] = useState(1);
  const [gstRate, setGstRate] = useState(25); // 25% GST

  // Calculate row prices
  useEffect(() => {
    const updatedRows = rows.map(row => ({
      ...row,
      price: Math.round(row.kg * row.rate)
    }));
    setRows(updatedRows);
  }, [rows.map(r => `${r.kg}-${r.rate}`).join(',')]);

  const updateRow = (index: number, field: keyof PriceRow, value: number) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setRows(updatedRows);
  };

  const updateFixedPrice = (field: keyof FixedPrice, value: number) => {
    setFixedPrices({ ...fixedPrices, [field]: value });
  };

  const calculateTotal = () => {
    const materialTotal = rows.reduce((sum, row) => sum + row.price, 0);
    const fixedTotal = fixedPrices.welding + fixedPrices.expence + fixedPrices.rubber;
    return materialTotal + fixedTotal;
  };

  const calculateGST = () => {
    return Math.round(calculateTotal() * (gstRate / 100));
  };

  const calculateFinal = () => {
    return calculateTotal() + calculateGST();
  };

  const total = calculateTotal();
  const gst = calculateGST();
  const final = calculateFinal();

  const rowColors: { [key: string]: string } = {
    'ROUND': 'bg-orange-200',
    'PIPE': 'bg-gray-200',
    'PLAT': 'bg-green-200',
    'PLATING': 'bg-gray-200',
    'GRINDING': 'bg-orange-200',
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Price Quotation</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Steel Materials Pricing Calculator</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black">
            {/* Header Row 1 */}
            <thead>
              <tr>
                <td colSpan={6} className="bg-yellow-300 text-red-700 text-2xl font-bold text-center py-3 tracking-widest border-2 border-black">
                  PRICE QUOTATION
                </td>
                <td className="bg-yellow-300 text-red-700 font-bold text-sm border-2 border-black px-2">DATE :-</td>
                <td colSpan={2} className="bg-yellow-300 text-red-700 text-xl font-bold border-2 border-black px-2">
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent border-none text-red-700 font-bold w-full text-center"
                  />
                </td>
              </tr>
              
              {/* Header Row 2 */}
              <tr>
                <td colSpan={2} className="bg-gray-300 font-bold border-2 border-black px-2">MATERIAL :</td>
                <td colSpan={2} className="bg-white font-bold border-2 border-black px-2">
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="bg-transparent border-none font-bold w-full"
                  />
                </td>
                <td className="bg-white font-bold text-xs border-2 border-black px-2">
                  QTY : <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-12 border-none bg-transparent font-bold" /> NOS
                </td>
                <td className="bg-white font-bold border-2 border-black px-2">HCP</td>
                <td colSpan={3} className="bg-white text-red-700 font-bold border-2 border-black px-2">
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="bg-transparent border-none text-red-700 font-bold w-full"
                  />
                </td>
              </tr>

              {/* Column Headers */}
              <tr>
                <td className="bg-blue-200 text-red-700 font-bold text-sm py-2 px-2 border-2 border-black">TYPE</td>
                <td className="bg-blue-200 text-red-700 font-bold text-sm py-2 px-2 border-2 border-black">DIAMETER</td>
                <td className="bg-blue-200 text-red-700 font-bold text-sm py-2 px-2 border-2 border-black">THIKNESS</td>
                <td className="bg-blue-200 text-red-700 font-bold text-sm py-2 px-2 border-2 border-black">LENGTH</td>
                <td colSpan={2} className="bg-blue-200 text-red-700 font-bold text-sm py-2 px-2 border-2 border-black">KG</td>
                <td className="bg-blue-200 text-red-700 font-bold text-sm py-2 px-2 border-2 border-black">RATE</td>
                <td colSpan={2} className="bg-blue-200 text-red-700 font-bold text-sm py-2 px-2 border-2 border-black">PRICE</td>
              </tr>
            </thead>

            <tbody>
              {/* Material Rows */}
              {rows.map((row, index) => (
                <tr key={row.type} className={rowColors[row.type] || 'bg-gray-100'}>
                  <td className="font-bold text-left pl-4 border-2 border-black px-2">{row.type}</td>
                  <td className="border-2 border-black px-2">
                    <input
                      type="number"
                      value={row.diameter}
                      onChange={(e) => updateRow(index, 'diameter', Number(e.target.value))}
                      className="w-full border-none bg-transparent text-center font-bold focus:outline-2 focus:outline-blue-500 focus:bg-yellow-50"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </td>
                  <td className="border-2 border-black px-2">
                    {row.type === 'ROUND' || row.type === 'PLAT' || row.type === 'PLATING' || row.type === 'GRINDING' ? (
                      <span className="text-center block">-</span>
                    ) : (
                      <input
                        type="number"
                        value={row.thickness}
                        onChange={(e) => updateRow(index, 'thickness', Number(e.target.value))}
                        className="w-full border-none bg-transparent text-center font-bold focus:outline-2 focus:outline-blue-500 focus:bg-yellow-50"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    )}
                  </td>
                  <td className="border-2 border-black px-2">
                    <input
                      type="number"
                      value={row.length}
                      onChange={(e) => updateRow(index, 'length', Number(e.target.value))}
                      className="w-full border-none bg-transparent text-center font-bold focus:outline-2 focus:outline-blue-500 focus:bg-yellow-50"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </td>
                  <td colSpan={2} className="border-2 border-black px-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.kg}
                      onChange={(e) => updateRow(index, 'kg', Number(e.target.value))}
                      className="w-full border-none bg-transparent text-center font-bold focus:outline-2 focus:outline-blue-500 focus:bg-yellow-50"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </td>
                  <td className="border-2 border-black px-2">
                    <input
                      type="number"
                      value={row.rate}
                      onChange={(e) => updateRow(index, 'rate', Number(e.target.value))}
                      className="w-full border-none bg-transparent text-center font-bold focus:outline-2 focus:outline-blue-500 focus:bg-yellow-50"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </td>
                  <td colSpan={2} className="font-bold text-center border-2 border-black px-2">
                    ₹{row.price.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}

              {/* WELDING & BALANCING Row */}
              <tr className="bg-blue-200">
                <td colSpan={4} className="font-bold text-left pl-4 border-2 border-black px-2">WELDING & BALANCING</td>
                <td colSpan={2} className="bg-white border-2 border-black px-2"></td>
                <td className="bg-white border-2 border-black px-2"></td>
                <td colSpan={2} className="border-2 border-black px-2">
                  <input
                    type="number"
                    value={fixedPrices.welding}
                    onChange={(e) => updateFixedPrice('welding', Number(e.target.value))}
                    className="w-full border-none bg-transparent text-center font-bold focus:outline-2 focus:outline-blue-500 focus:bg-yellow-50"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </td>
              </tr>

              {/* EXPENCE Row */}
              <tr className="bg-purple-200">
                <td colSpan={4} className="font-bold text-left pl-4 border-2 border-black px-2">EXPENCE</td>
                <td colSpan={2} className="border-2 border-black px-2">
                  <input
                    type="number"
                    value={expenceQty}
                    onChange={(e) => setExpenceQty(Number(e.target.value))}
                    className="w-full border-none bg-transparent text-center font-bold focus:outline-2 focus:outline-blue-500 focus:bg-yellow-50"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </td>
                <td className="bg-white border-2 border-black px-2"></td>
                <td colSpan={2} className="border-2 border-black px-2">
                  <input
                    type="number"
                    value={fixedPrices.expence}
                    onChange={(e) => updateFixedPrice('expence', Number(e.target.value))}
                    className="w-full border-none bg-transparent text-center font-bold focus:outline-2 focus:outline-blue-500 focus:bg-yellow-50"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </td>
              </tr>

              {/* RUBBER Row */}
              <tr className="bg-gray-200">
                <td colSpan={4} className="font-bold text-left pl-4 border-2 border-black px-2">RUBBER</td>
                <td colSpan={2} className="bg-white border-2 border-black px-2"></td>
                <td className="bg-white border-2 border-black px-2"></td>
                <td colSpan={2} className="border-2 border-black px-2">
                  <input
                    type="number"
                    value={fixedPrices.rubber}
                    onChange={(e) => updateFixedPrice('rubber', Number(e.target.value))}
                    className="w-full border-none bg-transparent text-center font-bold focus:outline-2 focus:outline-blue-500 focus:bg-yellow-50"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </td>
              </tr>

              {/* TOTAL Row */}
              <tr>
                <td colSpan={6} className="bg-white text-blue-700 text-2xl font-bold text-right pr-5 border-2 border-black py-2">TOTAL</td>
                <td className="bg-yellow-300 border-2 border-black px-2"></td>
                <td colSpan={2} className="bg-yellow-300 text-xl font-bold border-2 border-black px-2">
                  ₹{total.toLocaleString('en-IN')}
                </td>
              </tr>

              {/* GST Row */}
              <tr>
                <td colSpan={6} rowSpan={2} className="bg-white border-2 border-black"></td>
                <td colSpan={3} className="bg-green-300 text-white text-lg font-bold border-2 border-black px-2 py-2">
                  ₹ {gst.toLocaleString('en-IN')} (GST {gstRate}%)
                </td>
              </tr>

              {/* FINAL PRICE Row */}
              <tr>
                <td colSpan={3} className="bg-yellow-300 text-2xl font-bold border-2 border-black px-2 py-2">
                  ₹ {final.toLocaleString('en-IN')}
                </td>
              </tr>

              <tr>
                <td colSpan={6} className="bg-white text-red-700 text-2xl font-bold text-right pr-5 border-2 border-black py-2">FINAL PRICE</td>
                <td colSpan={3} className="bg-white border-2 border-black"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

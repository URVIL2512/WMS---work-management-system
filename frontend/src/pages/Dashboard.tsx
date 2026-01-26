import { FileText, ShoppingCart, Briefcase, Package, PackageCheck, Truck, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const orderData: any[] = [];
const jobStatusData: any[] = [];
const recentActivity: any[] = [];

export default function Dashboard() {
  const stats = [
    {
      title: 'Total Quotations',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <FileText size={24} />,
      color: 'bg-blue-500'
    },
    {
      title: 'Open Orders',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <ShoppingCart size={24} />,
      color: 'bg-green-500'
    },
    {
      title: 'Active Work Orders',
      value: '0',
      change: '0%',
      trend: 'down',
      icon: <Briefcase size={24} />,
      color: 'bg-orange-500'
    },
    {
      title: 'Vendor Jobs Pending',
      value: '0',
      change: '0',
      trend: 'up',
      icon: <Package size={24} />,
      color: 'bg-purple-500'
    },
    {
      title: 'Completed Jobs',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <PackageCheck size={24} />,
      color: 'bg-teal-500'
    },
    {
      title: 'Ready For Dispatch',
      value: '0',
      change: '0',
      trend: 'up',
      icon: <Truck size={24} />,
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your production.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.trend === 'up' ? (
                    <TrendingUp size={16} className="text-green-500 mr-1" />
                  ) : (
                    <TrendingDown size={16} className="text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                  <span className="text-gray-400 text-sm ml-1">vs last month</span>
                </div>
              </div>
              <div className={`${stat.color} text-white p-4 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Orders vs Dispatch</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orderData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#22C55E" name="Orders" />
              <Bar dataKey="dispatch" fill="#3B82F6" name="Dispatch" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Job Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={jobStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {jobStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Module</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((activity, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900">{activity.user}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{activity.action}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      {activity.module}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{activity.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

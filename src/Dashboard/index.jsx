import { useData } from '../providers/Data'
import AgentDashboard from './component/AgentDashboard'
import MicroservicesDashboard from './component/MicroservicesDashboard'
import SystemMicroservicesDashboard from './component/SystemMicroservicesDashboard'
import { StatusType } from '../Utils/Enums/StatusColor'

const Dashboard = () => {
  const { data } = useData()

  // Calculate key metrics
  const agentData = Object.values(data?.reducedAgents?.byName || [])
  const allMicroservices = data?.applications?.flatMap(app => app.microservices || []) || []
  const systemMicroservices = data?.systemApplications?.flatMap(app => app.microservices || []) || []

  const totalAgents = agentData.length
  const runningAgents = agentData.filter(agent => agent.daemonStatus === StatusType.RUNNING).length
  const totalMicroservices = allMicroservices.length
  const runningMicroservices = allMicroservices.filter(msvc => msvc.status?.status?.toUpperCase() === StatusType.RUNNING).length
  const totalSystemMicroservices = systemMicroservices.length
  const runningSystemMicroservices = systemMicroservices.filter(msvc => msvc.status?.status?.toUpperCase() === StatusType.RUNNING).length

  const metrics = [
    {
      title: 'Edge Nodes',
      value: totalAgents,
      running: runningAgents,
      color: 'from-blue-500 to-blue-600',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      )
    },
    {
      title: 'Microservices',
      value: totalMicroservices,
      running: runningMicroservices,
      color: 'from-green-500 to-green-600',
      icon: '⚙️'
    },
    {
      title: 'System Microservices',
      value: totalSystemMicroservices,
      running: runningSystemMicroservices,
      color: 'from-purple-500 to-purple-600',
      icon: '🔧'
    },
    {
      title: 'Overall Health',
      value: `${Math.round(((runningAgents + runningMicroservices + runningSystemMicroservices) / (totalAgents + totalMicroservices + totalSystemMicroservices)) * 100)}%`,
      running: null,
      color: 'from-emerald-500 to-emerald-600',
      icon: '📊'
    }
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-auto'>
      {/* Header */}
      <div className='bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-white mb-2'>Cluster Dashboard</h1>
              <p className='text-gray-300 text-sm'>Real-time cluster monitoring</p>
            </div>
            <div className='text-right'>
              <div className='text-sm text-gray-400'>Last Updated</div>
              <div className='text-lg font-semibold text-white'>{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Key Metrics Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8'>
          {metrics.map((metric, index) => (
            <div key={index} className={`bg-gradient-to-br ${metric.color} rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
              <div className='flex items-center justify-between'>
                <div className='min-w-0 flex-1'>
                  <p className='text-white/80 text-xs sm:text-sm font-medium uppercase tracking-wide truncate'>{metric.title}</p>
                  <p className='text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2'>{metric.value}</p>
                  {metric.running !== null && (
                    <p className='text-white/70 text-xs sm:text-sm mt-1'>
                      {metric.running} running
                    </p>
                  )}
                </div>
                <div className='text-3xl sm:text-4xl opacity-80 flex-shrink-0 ml-2'>
                  {metric.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Cards */}
        <div className='space-y-8'>
          <AgentDashboard
            agentData={agentData}
          />
          <MicroservicesDashboard
            applications={data?.applications}
            title='Microservice'
          />
          <SystemMicroservicesDashboard
            systemApplications={data?.systemApplications}
            title='System Microservice'
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard

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
      icon: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="m9.25 22l-.4-3.2q-.325-.125-.612-.3t-.563-.375L4.7 19.375l-2.75-4.75l2.575-1.95Q4.5 12.5 4.5 12.338v-.675q0-.163.025-.338L1.95 9.375l2.75-4.75l2.975 1.25q.275-.2.575-.375t.6-.3l.4-3.2h5.5l.4 3.2q.325.125.613.3t.562.375l2.975-1.25l2.75 4.75l-2.575 1.95q.025.175.025.338v.674q0 .163-.05.338l2.575 1.95l-2.75 4.75l-2.95-1.25q-.275.2-.575.375t-.6.3l-.4 3.2zm2.8-6.5q1.45 0 2.475-1.025T15.55 12t-1.025-2.475T12.05 8.5q-1.475 0-2.488 1.025T8.55 12t1.013 2.475T12.05 15.5"/></svg>)
    },
    {
      title: 'System Microservices',
      value: totalSystemMicroservices,
      running: runningSystemMicroservices,
      color: 'from-purple-500 to-purple-600',
      icon: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="m22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9c-2-2-5-2.4-7.4-1.3L9 6L6 9L1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4"/></svg>)
    },
    {
      title: 'Overall Health',
      value: `${Math.round(((runningAgents + runningMicroservices + runningSystemMicroservices) / (totalAgents + totalMicroservices + totalSystemMicroservices)) * 100)}%`,
      running: null,
      color: 'from-emerald-500 to-emerald-600',
      icon: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="M22 21H2V3h2v16h2v-9h4v9h2V6h4v13h2v-5h4z"/></svg>)
    }
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-auto'>
      {/* Header */}
      <div className='bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10'>
        <div className='w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl xl:text-4xl 2xl:text-5xl font-bold text-white mb-2'>Cluster Dashboard</h1>
              <p className='text-gray-300 text-sm xl:text-base 2xl:text-lg'>Real-time cluster monitoring</p>
            </div>
            <div className='text-right'>
              <div className='text-sm xl:text-base text-gray-400'>Last Updated</div>
              <div className='text-lg xl:text-xl 2xl:text-2xl font-semibold text-white'>{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className='w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 py-8'>
        {/* Key Metrics Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-4 gap-4 sm:gap-6 xl:gap-8 2xl:gap-10 mb-6 sm:mb-8 xl:mb-10'>
          {metrics.map((metric, index) => (
            <div key={index} className={`bg-gradient-to-br ${metric.color} rounded-xl p-4 sm:p-6 xl:p-8 2xl:p-10 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
              <div className='flex items-center justify-between'>
                <div className='min-w-0 flex-1'>
                  <p className='text-white/80 text-xs sm:text-sm font-medium uppercase tracking-wide truncate'>{metric.title}</p>
                  <p className='text-2xl sm:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-white mt-1 sm:mt-2'>{metric.value}</p>
                  {metric.running !== null 
                    ? (
                        <p className='text-white/70 text-xs sm:text-sm mt-1'>
                          {metric.running} running
                        </p>
                      ) 
                    : <p className='mt-5' />}
                </div>
                <div className='text-3xl sm:text-4xl opacity-80 flex-shrink-0 ml-2'>
                  {metric.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Cards */}
        <div className='space-y-8 xl:space-y-12 2xl:space-y-16'>
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

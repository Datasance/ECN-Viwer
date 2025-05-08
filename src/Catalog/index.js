import React from 'react'
import ApplicationCatalog from './Application'

export default function Catalog() {
  return (
    <div className="max-h-[90.8vh] min-h-[90.8vh] overflow-auto">
      <div className="h-[60px] uppercase text-[20px] font-bold flex flex-col justify-center pl-[30px]">
        Application template catalog
      </div>
      <ApplicationCatalog title="Applications" />
    </div>
  )
}

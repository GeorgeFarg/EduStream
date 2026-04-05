import React from 'react'

const LoadingClass = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] w-full">
            <div className="animate-spin rounded-full border-4 border-blue-400 border-t-transparent h-12 w-12 mb-4"></div>
            <span className="text-lg text-blue-500 font-medium">Loading class...</span>
        </div>
    )
}

export default LoadingClass
import ClassPage from './ClassPageClient';
import React from 'react'


const ClassDetails = async ({
    params,
}: {
    params: Promise<{ id: string }>
}) => {
    const { id } = await params;

    return (
        <div><ClassPage /></div>
    )
}

export default ClassDetails
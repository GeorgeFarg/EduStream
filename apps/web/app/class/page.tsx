import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react'

const Class = async () => {
    redirect("/dashboard");
}

export default Class
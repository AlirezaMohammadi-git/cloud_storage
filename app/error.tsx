"use client"

import { Button } from "@/components/ui/button"


const ErrorPage = ({ error, reset }: {
    error: Error & { digest?: string }
    reset: () => void
}) => {
    console.log(error)
    return (
        <div className="flex-center flex-col gap-3 h-screen">
            <p className="text-sm text-error">Something went wrong! ({error.message})</p>
            <Button onClick={() => reset()}>try again</Button>
        </div>
    )
}

export default ErrorPage
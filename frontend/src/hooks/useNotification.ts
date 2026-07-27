import {useRef, useState} from 'react'

type Notification = {type: 'success' | 'error'; message: string}

export function useNotification() {
    const [notification, setNotification] = useState<Notification | null>(null)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const notify = (type: Notification['type'], message: string) => {
        if (timer.current) clearTimeout(timer.current)
        setNotification({type, message})
        timer.current = setTimeout(() => setNotification(null), 4000)
    }

    const dismiss = () => setNotification(null)

    return {notification, notify, dismiss}
}

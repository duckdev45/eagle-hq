'use client'

import {useEffect, useRef, useState} from 'react'

const PASSCODE = '0000'

interface LoadingScreenProps {
    jiraDone: boolean
    sheetDone: boolean
    onUnlock: () => void
}

export function LoadingScreen({jiraDone, sheetDone, onUnlock}: LoadingScreenProps) {
    const ready = jiraDone && sheetDone
    const [pw, setPw] = useState('')
    const [err, setErr] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (ready) inputRef.current?.focus()
    }, [ready])

    const tryUnlock = (v: string) => {
        if (v === PASSCODE) {
            onUnlock()
            return
        }
        setErr(true)
        setPw('')
    }

    const onChange = (v: string) => {
        const digits = v.replace(/\D/g, '').slice(0, 4)
        setErr(false)
        setPw(digits)
        if (digits.length === 4) tryUnlock(digits)
    }

    return (
        <div className='boot-screen'>
            <div className='boot-inner'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className='boot-logo' src='/logo-square.svg' alt='Eagle AI'/>
                <div className='boot-title'>EAGLE AI · TEAM HQ</div>
                <div className={`boot-bar${ready ? ' full' : ''}`}><span className='fill'/></div>
                <div className='boot-rows'>
                    <div className='boot-row'>
                        <span>DATA SYNC</span>
                        <span className='dots'/>
                        <span className={jiraDone ? 'ok' : 'wait'}>{jiraDone ? 'OK' : '···'}</span>
                    </div>
                    <div className='boot-row'>
                        <span>SETTING OFFICE</span>
                        <span className='dots'/>
                        <span className={sheetDone ? 'ok' : 'wait'}>{sheetDone ? 'OK' : '···'}</span>
                    </div>
                </div>
                {ready ? (
                    <div className={`boot-pass${err ? ' err' : ''}`}>
                        <div className='boot-pass-label'>{err ? 'WRONG PASSWORD' : 'ENTER PASSWORD'}</div>
                        <div className='boot-pass-cells' onClick={() => inputRef.current?.focus()}>
                            {[0, 1, 2, 3].map((i) => (
                                <span key={i} className={`cell${pw.length === i ? ' cur' : ''}`}>
                                    {pw[i] ? '*' : ''}
                                </span>
                            ))}
                        </div>
                        <input
                            ref={inputRef}
                            className='boot-pass-input'
                            type='password'
                            inputMode='numeric'
                            autoComplete='off'
                            value={pw}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') tryUnlock(pw) }}
                        />
                    </div>
                ) : (
                    <div className='boot-blink'>NOW LOADING</div>
                )}
            </div>
            <div className='boot-scan'/>
        </div>
    )
}

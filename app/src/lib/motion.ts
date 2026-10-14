import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, SplitText, useGSAP)

/** Kueri yang menjaga semua animasi scroll: tidak dibuat bila pengguna minta gerak dikurangi. */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'

export { gsap, ScrollTrigger, SplitText, useGSAP }

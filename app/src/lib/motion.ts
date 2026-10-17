import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { useGSAP } from '@gsap/react'

// Hanya plugin yang benar-benar dipakai yang didaftarkan (MotionPath: PacketDelivered).
// ScrollTrigger dan SplitText ikut dicabut bersama teks gulir dan tumpukan kartu Dasbor.
gsap.registerPlugin(MotionPathPlugin, useGSAP)

/** Kueri yang menjaga semua animasi: tidak dibuat bila pengguna minta gerak dikurangi. */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'

export { gsap, useGSAP }

import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { useGSAP } from '@gsap/react'

// Hanya plugin yang benar-benar dipakai yang didaftarkan (MotionPath: PacketDelivered).
// ScrollTrigger dan SplitText ikut dicabut bersama teks gulir dan tumpukan kartu Dasbor.
gsap.registerPlugin(MotionPathPlugin, useGSAP)

const KUERI_HALUS = '(prefers-reduced-motion: no-preference)'

/**
 * Kueri yang menjaga semua animasi: tidak dibuat bila pengguna minta gerak dikurangi.
 * Sengaja `let`: impor ES adalah live binding, jadi pilihan "Kurangi" di menu profil
 * (lib/gerak.ts) mengubahnya menjadi `not all`, kueri yang tidak pernah cocok, untuk
 * setiap gsap.matchMedia yang dibuat sesudahnya.
 */
export let MOTION_OK = KUERI_HALUS

export function aturMotionOk(kurangi: boolean) {
  MOTION_OK = kurangi ? 'not all' : KUERI_HALUS
}

export { gsap, useGSAP }

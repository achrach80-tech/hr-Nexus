import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(num))
}

export function formatDate(date: string | Date): string {
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  }).format(new Date(date))
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Actif': 'text-green-400 bg-green-400/10',
    'Inactif': 'text-gray-400 bg-gray-400/10',
    'Suspendu': 'text-orange-400 bg-orange-400/10',
    'active': 'text-green-400 bg-green-400/10',
    'pending': 'text-yellow-400 bg-yellow-400/10',
    'inactive': 'text-gray-400 bg-gray-400/10'
  }
  return colors[status] || 'text-gray-400 bg-gray-400/10'
}
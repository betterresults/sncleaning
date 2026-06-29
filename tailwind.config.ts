import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			spacing: {
				'2': '0.2rem',
				'shell-gutter': 'var(--shell-gutter)',
				'shell-gap': 'var(--shell-gap)',
				'shell-block': 'var(--shell-block-gap)',
				'shell-section': 'var(--shell-after-divider)',
				'shell-section-gap': 'var(--shell-section-gap)',
			},
			colors: {
				shell: {
					text: 'var(--shell-text)',
					muted: 'var(--shell-text-muted)',
					faint: 'var(--shell-text-faint)',
					brand: 'var(--shell-tint)',
					divider: 'var(--shell-divider)',
					stat: {
						brand: {
							DEFAULT: 'var(--shell-stat-brand-fg)',
							bg: 'var(--shell-stat-brand-bg)',
						},
						success: {
							DEFAULT: 'var(--shell-stat-success-fg)',
							bg: 'var(--shell-stat-success-bg)',
						},
						warning: {
							DEFAULT: 'var(--shell-stat-warning-fg)',
							bg: 'var(--shell-stat-warning-bg)',
						},
						error: {
							DEFAULT: 'var(--shell-stat-error-fg)',
							bg: 'var(--shell-stat-error-bg)',
						},
					},
				},
				blue: {
					50: '#e6eff5',
					100: '#c2dae7',
					200: '#9bc4d8',
					300: '#74aeca',
					400: '#579dbe',
					500: '#185166',
					600: '#164a5c',
					700: '#124150',
					800: '#0e3744',
					900: '#082630',
					950: '#041721',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				shell: 'var(--shell-card-radius)',
				'shell-segment': '10px',
			},
			maxWidth: {
				'shell-default': 'var(--shell-page-max)',
				'shell-narrow': '42rem',
				'shell-wide': '96rem',
			},
			transitionTimingFunction: {
				'shell-sidebar': 'var(--shell-sidebar-ease)',
			},
			transitionDuration: {
				'shell-sidebar': '280ms',
				'shell-nav': '220ms',
			},
			width: {
				'shell-sidebar': 'var(--shell-sidebar-width)',
				'shell-sidebar-collapsed': 'var(--shell-sidebar-collapsed-width)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'shell-stat-pulse': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.45' },
				},
				'shell-fade': {
					from: { opacity: '0' },
					to: { opacity: '1' },
				},
				'shell-slide': {
					from: { transform: 'translateX(-100%)' },
					to: { transform: 'translateX(0)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'shell-stat-pulse': 'shell-stat-pulse 1.4s ease-in-out infinite',
				'shell-fade': 'shell-fade 0.22s ease',
				'shell-slide': 'shell-slide 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

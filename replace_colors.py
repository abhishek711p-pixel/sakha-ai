import re

with open('client/src/index.css', 'r') as f:
    content = f.read()

# Replace variables
content = content.replace('--primary: 43 80% 52%;', '--primary: 217 91% 60%;')
content = content.replace('--accent: 43 80% 52%;', '--accent: 217 91% 60%;')
content = content.replace('--ring: 43 80% 52%;', '--ring: 217 91% 60%;')
content = content.replace('--gold: 43 80% 52%;', '--gold: 217 91% 60%;')
content = content.replace('--gold-light: 43 85% 65%;', '--gold-light: 213 94% 68%;')
content = content.replace('--gold-glow: 43 90% 58%;', '--gold-glow: 217 91% 65%;')

content = content.replace('--primary: 43 85% 55%;', '--primary: 217 91% 60%;')
content = content.replace('--accent: 43 85% 55%;', '--accent: 217 91% 60%;')
content = content.replace('--ring: 43 85% 55%;', '--ring: 217 91% 60%;')

content = content.replace('--sidebar-primary: 43 85% 55%;', '--sidebar-primary: 217 91% 60%;')
content = content.replace('--sidebar-ring: 43 85% 55%;', '--sidebar-ring: 217 91% 60%;')

# Replace hex gold
content = content.replace('#d4af37', '#3b82f6')
content = content.replace('rgba(212, 175, 55', 'rgba(59, 130, 246')

# Replace HSL functions
content = re.sub(r'hsl\(\s*43\s+85%\s+55%\s*\)', 'hsl(217 91% 60%)', content)
content = re.sub(r'hsl\(\s*43\s+90%\s+68%\s*\)', 'hsl(213 94% 68%)', content)
content = re.sub(r'hsl\(\s*43\s+90%\s+60%\s*\)', 'hsl(213 91% 65%)', content)
content = re.sub(r'hsl\(\s*43,\s*80%,\s*58%\s*\)', 'hsl(217, 91%, 60%)', content)
content = re.sub(r'hsl\(\s*45,\s*90%,\s*72%\s*\)', 'hsl(213, 94%, 72%)', content)
content = re.sub(r'hsl\(\s*45,\s*90%,\s*78%\s*\)', 'hsl(213, 94%, 78%)', content)
content = re.sub(r'hsl\(\s*43,\s*80%,\s*52%\s*\)', 'hsl(217, 91%, 60%)', content)
content = re.sub(r'hsl\(\s*43,\s*85%,\s*58%\s*\)', 'hsl(213, 91%, 65%)', content)

# Replace HSLA functions
content = re.sub(r'hsla\(\s*43,\s*85%,\s*55%,', 'hsla(217, 91%, 60%,', content)
content = re.sub(r'hsla\(\s*43,\s*80%,\s*52%,', 'hsla(217, 91%, 60%,', content)

# text-gradient-gold to gradient-blue logic
content = content.replace('text-gradient-gold', 'text-gradient-gold') # Keep class name so JS doesn't break

with open('client/src/index.css', 'w') as f:
    f.write(content)


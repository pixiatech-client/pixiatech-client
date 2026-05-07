import sys
import os

path = r'f:\PIXIATECH\new d\Estimation V3\src\app\admin\quote-requests\_components\estimation\details\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Fix line 807 (index 806)
# Original: 807: <section className="space-y-4">
# We want to wrap it in AnimatePresence and make it motion.section
lines[806] = '                <AnimatePresence>\n'
lines.insert(807, '                  <motion.section \n')
lines.insert(808, '                    initial={{ opacity: 0 }}\n')
lines.insert(809, '                    animate={{ opacity: 1 }}\n')
lines.insert(810, '                    className="space-y-4"\n')
lines.insert(811, '                  >\n')

# Note: After inserting 5 lines, everything below shifts by 5.

# 2. Fix the area around 1059 (was line 1059 before shift, now 1064)
# Let's find </motion.section> around that area.
for i in range(1060, 1080):
    if i < len(lines) and '</motion.section>' in lines[i]:
        # This is the end of the section that started at 807
        # We need to add </div> after it to close 559
        lines.insert(i+1, '                </div>\n')
        break

# 3. Verify the final closing of the drawer
# We had:
# 1066:             </motion.div>
# 1067:           </div>
# 1068:         )}
# 1069:       </AnimatePresence>

# Let's check where they are now.
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const oldDistractors = `              <div className="relative w-full h-full">
                {/* Full card (instant fade out on slice) */}
                <motion.div 
                  className="absolute inset-0 bg-amber-100 border-4 border-amber-600 px-2 py-1 rounded-xl shadow-xl text-center flex flex-col justify-center items-center overflow-hidden"
                  animate={{ opacity: item.sliced ? 0 : 1 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="absolute left-0 top-1/2 w-2 h-full bg-amber-700 -translate-y-1/2 rounded-l-md transform -translate-x-full"></div>
                  <div className="absolute right-0 top-1/2 w-2 h-full bg-amber-700 -translate-y-1/2 rounded-r-md transform translate-x-full"></div>
                  <span 
                    className="font-bold text-amber-900 block relative z-10 select-none leading-tight whitespace-pre-wrap"
                    style={{ fontSize: item.text.length > 25 ? '0.75rem' : item.text.length > 15 ? '0.9rem' : '1.15rem' }}
                  >
                    {item.text}
                  </span>
                </motion.div>
                {/* Left Half */}
                <motion.div 
                  className="absolute inset-0 bg-amber-100 border-4 border-amber-600 px-2 py-1 rounded-xl shadow-xl text-center flex flex-col justify-center items-center overflow-hidden"
                  style={{ clipPath: 'polygon(0 0, 61% 0, 41% 100%, 0 100%)' }}
                  animate={item.sliced ? { x: -60, y: 80, rotate: -15, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <span 
                    className="font-bold text-amber-900 block relative z-10 select-none leading-tight whitespace-pre-wrap"
                    style={{ fontSize: item.text.length > 25 ? '0.75rem' : item.text.length > 15 ? '0.9rem' : '1.15rem' }}
                  >
                    {item.text}
                  </span>
                </motion.div>
                {/* Right Half */}
                <motion.div 
                  className="absolute inset-0 bg-amber-100 border-4 border-amber-600 px-2 py-1 rounded-xl shadow-xl text-center flex flex-col justify-center items-center overflow-hidden"
                  style={{ clipPath: 'polygon(59% 0, 100% 0, 100% 100%, 39% 100%)' }}
                  animate={item.sliced ? { x: 60, y: 80, rotate: 15, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <span 
                    className="font-bold text-amber-900 block relative z-10 select-none leading-tight whitespace-pre-wrap"
                    style={{ fontSize: item.text.length > 25 ? '0.75rem' : item.text.length > 15 ? '0.9rem' : '1.15rem' }}
                  >
                    {item.text}
                  </span>
                </motion.div>`;

const newDistractors = `              <div className="relative w-full h-full">
                {/* Full card (instant fade out on slice) */}
                <motion.div 
                  className="absolute inset-x-2 top-0 bottom-0 bg-[#0f4d31] rounded-sm shadow-xl text-center flex flex-col justify-center items-center"
                  animate={{ opacity: item.sliced ? 0 : 1 }}
                  transition={{ duration: 0.1 }}
                >
                  {/* Bamboo Caps */}
                  <div className="absolute left-[-8px] top-[-4px] bottom-[-4px] w-[8px] bg-[#0a3822] rounded-l-[4px]" />
                  <div className="absolute right-[-8px] top-[-4px] bottom-[-4px] w-[8px] bg-[#0a3822] rounded-r-[4px]" />
                  <span 
                    className="font-bold text-white block relative z-10 select-none leading-tight whitespace-pre-wrap px-2"
                    style={{ fontSize: item.text.length > 25 ? '0.75rem' : item.text.length > 15 ? '0.9rem' : '1.15rem' }}
                  >
                    {item.text}
                  </span>
                </motion.div>
                
                {/* Left Half */}
                <motion.div 
                  className="absolute inset-x-2 top-0 bottom-0 bg-[#0f4d31] rounded-sm shadow-xl text-center flex flex-col justify-center items-center"
                  style={{ clipPath: 'polygon(-20% -20%, 61% -20%, 41% 120%, -20% 120%)' }}
                  animate={item.sliced ? { x: -60, y: 80, rotate: -15, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="absolute left-[-8px] top-[-4px] bottom-[-4px] w-[8px] bg-[#0a3822] rounded-l-[4px]" />
                  <span 
                    className="font-bold text-white block relative z-10 select-none leading-tight whitespace-pre-wrap px-2"
                    style={{ fontSize: item.text.length > 25 ? '0.75rem' : item.text.length > 15 ? '0.9rem' : '1.15rem' }}
                  >
                    {item.text}
                  </span>
                </motion.div>
                
                {/* Right Half */}
                <motion.div 
                  className="absolute inset-x-2 top-0 bottom-0 bg-[#0f4d31] rounded-sm shadow-xl text-center flex flex-col justify-center items-center"
                  style={{ clipPath: 'polygon(59% -20%, 120% -20%, 120% 120%, 39% 120%)' }}
                  animate={item.sliced ? { x: 60, y: 80, rotate: 15, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="absolute right-[-8px] top-[-4px] bottom-[-4px] w-[8px] bg-[#0a3822] rounded-r-[4px]" />
                  <span 
                    className="font-bold text-white block relative z-10 select-none leading-tight whitespace-pre-wrap px-2"
                    style={{ fontSize: item.text.length > 25 ? '0.75rem' : item.text.length > 15 ? '0.9rem' : '1.15rem' }}
                  >
                    {item.text}
                  </span>
                </motion.div>`;

code = code.replace(oldDistractors, newDistractors);
fs.writeFileSync('src/components/GameView.tsx', code);

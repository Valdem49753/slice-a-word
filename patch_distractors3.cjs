const fs = require('fs');
let code = fs.readFileSync('src/components/GameView.tsx', 'utf8');

const regex = /<div className="relative w-full h-full">([\s\S]*?)<\/div>\s*<\/motion\.div>\s*\)\)/;

const newHTML = `<div className="relative w-full h-full">
                {/* Full card (instant fade out on slice) */}
                <motion.div 
                  className="absolute inset-x-2 top-0 bottom-0 bg-[#16a34a] border-y-2 border-[#15803d] rounded-sm shadow-xl text-center flex flex-col justify-center items-center"
                  animate={{ opacity: item.sliced ? 0 : 1 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="absolute left-[-8px] top-[-2px] bottom-[-2px] w-[8px] bg-[#14532d] rounded-l-[4px]" />
                  <div className="absolute right-[-8px] top-[-2px] bottom-[-2px] w-[8px] bg-[#14532d] rounded-r-[4px]" />
                  <span 
                    className="font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] block relative z-10 select-none leading-tight whitespace-pre-wrap px-2"
                    style={{ fontSize: item.text.length > 25 ? '0.75rem' : item.text.length > 15 ? '0.9rem' : '1.15rem' }}
                  >
                    {item.text}
                  </span>
                </motion.div>

                {/* Left Half */}
                <motion.div 
                  className="absolute inset-x-2 top-0 bottom-0 bg-[#16a34a] border-y-2 border-[#15803d] rounded-sm shadow-xl text-center flex flex-col justify-center items-center"
                  style={{ clipPath: 'polygon(-20% -20%, 61% -20%, 41% 120%, -20% 120%)' }}
                  animate={item.sliced ? { x: -60, y: 80, rotate: -15, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="absolute left-[-8px] top-[-2px] bottom-[-2px] w-[8px] bg-[#14532d] rounded-l-[4px]" />
                  <span 
                    className="font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] block relative z-10 select-none leading-tight whitespace-pre-wrap px-2"
                    style={{ fontSize: item.text.length > 25 ? '0.75rem' : item.text.length > 15 ? '0.9rem' : '1.15rem' }}
                  >
                    {item.text}
                  </span>
                </motion.div>

                {/* Right Half */}
                <motion.div 
                  className="absolute inset-x-2 top-0 bottom-0 bg-[#16a34a] border-y-2 border-[#15803d] rounded-sm shadow-xl text-center flex flex-col justify-center items-center"
                  style={{ clipPath: 'polygon(59% -20%, 120% -20%, 120% 120%, 39% 120%)' }}
                  animate={item.sliced ? { x: 60, y: 80, rotate: 15, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="absolute right-[-8px] top-[-2px] bottom-[-2px] w-[8px] bg-[#14532d] rounded-r-[4px]" />
                  <span 
                    className="font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] block relative z-10 select-none leading-tight whitespace-pre-wrap px-2"
                    style={{ fontSize: item.text.length > 25 ? '0.75rem' : item.text.length > 15 ? '0.9rem' : '1.15rem' }}
                  >
                    {item.text}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          ))`;

code = code.replace(regex, newHTML);
fs.writeFileSync('src/components/GameView.tsx', code);

# ગુજરાતી આવક અને ખર્ચ ટ્રેકર

Next.js, TypeScript અને MongoDB આધારિત વ્યક્તિગત આવક-ખર્ચ ટ્રેકર.

## જરૂરી સોફ્ટવેર

- Node.js 20 અથવા તેથી નવું
- MongoDB Atlas અથવા સ્થાનિક MongoDB

## લોકલ સેટઅપ

1. આ પ્રોજેક્ટ ફોલ્ડર VS Code માં ખોલો.
2. ટર્મિનલમાં `npm install` ચલાવો.
3. `.env.example` ની નકલ કરીને `.env.local` બનાવો.
4. `.env.local` માં `MONGODB_URI` અને `JWT_SECRET` માટે તમારા પોતાના મૂલ્યો મૂકો. આ ફાઇલ GitHub પર અપલોડ ન કરો.
5. `npm run dev` ચલાવો અને ટર્મિનલમાં બતાવેલું સ્થાનિક સરનામું ખોલો.
6. TypeScript ચેક માટે `npx tsc --noEmit` અને production build માટે `npm run build` ચલાવો.

## Vercel પર Deploy

1. પ્રોજેક્ટને GitHub repository માં push કરો.
2. Vercel માં **Add New → Project** પસંદ કરીને repository Import કરો.
3. Framework Preset `Next.js` જ રાખો.
4. Project Settings → Environment Variables માં `MONGODB_URI` અને `JWT_SECRET` ઉમેરો.
5. MongoDB Atlas માં Network Access અને database user permissions યોગ્ય રીતે સેટ કરો.
6. Deploy કરો.

## સુરક્ષા નોંધ

- વાસ્તવિક secrets માત્ર `.env.local` અથવા Vercel Environment Variables માં રાખો.
- `.env`, `.env.local`, `.git` અને `node_modules` આ શેર કરેલી ZIPમાં સામેલ નથી.
- આ કોડનું syntax formatting અને મૂળભૂત source parsing ચકાસવામાં આવ્યું છે; સંપૂર્ણ build ચલાવવા dependencies ઇન્સ્ટોલ કરીને `npm run build` સફળ થવું જરૂરી છે.


## બધા ડિવાઇસમાં ડેટા સિંક

- બધા લોકો અને ટ્રાન્ઝેક્શન MongoDB Atlasમાં તમારા યુઝર એકાઉન્ટના `userId` સાથે સેવ થાય છે; બ્રાઉઝરનું local storage મુખ્ય ડેટા સ્ટોર નથી.
- બીજા મોબાઇલ/કમ્પ્યુટરમાં એ જ ઇમેઇલ અને પાસવર્ડથી લૉગિન કરો. બંને ડિવાઇસમાં એક જ એકાઉન્ટ વાપરવાથી એ જ રેકોર્ડ જોવા મળશે.
- એપ ખુલ્લી હોય ત્યારે તે દર 15 સેકન્ડે ડેટા રિફ્રેશ કરે છે, અને ટૅબ/વિન્ડો ફરી સક્રિય થાય ત્યારે પણ રિફ્રેશ કરે છે. ઇન્ટરનેટ અને MongoDB કનેક્શન જરૂરી છે.
- મોબાઇલના ઉપરના જમણા ખૂણે નાનું **લૉગઆઉટ** બટન ઉમેરેલું છે. લૉગઆઉટ પછી તે ડિવાઇસની સેશન કૂકી દૂર થાય છે; MongoDBમાં સેવ થયેલો ડેટા ડિલીટ થતો નથી.

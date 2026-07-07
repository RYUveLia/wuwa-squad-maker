import fs from 'fs';
import path from 'path';
import https from 'https';

const HTML_FILE_PATH = '/Users/er.hyun/.gemini/antigravity-ide/brain/43542a7d-5b78-4f97-bf63-0eda2ec7491a/.system_generated/steps/92/content.md';
const OUTPUT_JSON_PATH = path.join(process.cwd(), 'src/data/characters.json');
const IMAGE_DIR = path.join(process.cwd(), 'public/characters');

const KR_NAME_MAP = {
  // 플레이어블 및 주요 캐릭터 번역
  "Jinhsi": "금희",
  "Jiyan": "기염",
  "Yinlin": "음림",
  "Verina": "벨리나",
  "Changli": "장리",
  "Jianxin": "감심",
  "Calcharo": "카카루",
  "Encore": "앙코",
  "Lingyang": "능양",
  "Rover": "방랑자",
  "Danjin": "단근",
  "Sanhua": "산화",
  "Mortefi": "모르테피",
  "Chixia": "치샤",
  "Baizhi": "설지",
  "Yangyang": "양양",
  "Taoqi": "도기",
  "Aalto": "알토",
  "Yuanwu": "연무",
  "Zhezhi": "절지",
  "Xiangli Yao": "상리요",
  "Shorekeeper": "파수인",
  "Youhu": "유호",
  "Camellya": "카멜리아",
  "Lumi": "루미",
  "Carlotta": "카를로타",
  "Roccia": "로코코",
  "Brant": "브렌트",
  "Rinascita": "리나시타",
  "Iuno": "유노",
  "Lucilla": "루실라",
  "Lucy": "루시",
  "Lupa": "루파",
  "Tethys": "테티스",
  "Gesa": "게사",
  "Zani": "젠니",
  "Hsin": "여우의 별자리",
  "Jingran": "경연",
  "Qingxiao": "청초",
  "Suoming": "쇄명",
  "Yangyang Xuanling": "양양 현령",
  "Luuk Herssen": "루크 헤르센",
  "Lynae": "린네",
  "Sigrika": "시그리카",
  "Aemeath": "에이메스",
  "Augusta": "아우구스타",
  "Buling": "복링",
  "Cantarella": "칸타렐라",
  "Cartethyia": "카르티시아",
  "Chisa": "치사",
  "Ciaccona": "샤콘",
  "Denia": "데니아",
  "Galbrena": "갈브레나",
  "Hiyuki": "히유키",
  "Phoebe": "페비",
  "Phrolova": "플로로",
  "Rebecca": "레베카",
  "Mornye": "모니에",
  "Suisui": "수수"
};

const ELEMENTS = ['Aero', 'Glacio', 'Electro', 'Spectro', 'Fusion', 'Havoc'];
const WEAPONS = ['Gauntlets', 'Broadblade', 'Rectifier', 'Pistols', 'Sword'];

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  console.log('Reading HTML file...');
  const html = fs.readFileSync(HTML_FILE_PATH, 'utf-8');

  // <tr>...</tr> 행들을 모두 추출
  const trRegex = /<tr>([\s\S]*?)<\/tr>/g;
  let match;
  const characters = [];

  console.log('Parsing characters data...');
  while ((match = trRegex.exec(html)) !== null) {
    const trContent = match[1];

    // 캐릭터 프로필 이미지와 이름 매칭
    const imgMatch = trContent.match(/<img alt="Resonator ([^"]+)"[^>]*?data-src="([^"]+)"/);
    if (!imgMatch) continue;

    const enName = imgMatch[1].trim();
    let imgUrl = imgMatch[2];
    imgUrl = imgUrl.replace(/\/scale-to-width-down\/\d+/, '');

    // 등급 파싱
    const rarityMatch = trContent.match(/<span title="(\d) Stars">/);
    const rarity = rarityMatch ? parseInt(rarityMatch[1], 10) : 5;

    // 속성(Element) 파싱
    let element = 'Unknown';
    for (const elem of ELEMENTS) {
      if (trContent.includes(`alt="${elem} Icon"`) || trContent.includes(`title="${elem}"`)) {
        element = elem;
        break;
      }
    }

    // 무기(Weapon) 파싱
    let weapon = 'Unknown';
    for (const wep of WEAPONS) {
      if (trContent.includes(`alt="${wep} Icon"`) || trContent.includes(`title="${wep}"`)) {
        weapon = wep;
        break;
      }
    }

    // 출시 버전 파싱 (8번째 열 정보)
    const versionMatch = trContent.match(/href="\/wiki\/Version\/(\d+\.\d+)"/);
    const releaseVersion = versionMatch ? parseFloat(versionMatch[1]) : 9.9;

    // 한국어 이름 맵핑
    const krName = KR_NAME_MAP[enName] || enName;

    // 중복 제거
    if (characters.some(c => c.id === enName.toLowerCase().replace(/\s+/g, '-'))) {
      continue;
    }

    characters.push({
      id: enName.toLowerCase().replace(/\s+/g, '-'),
      name: krName,
      enName: enName,
      rarity: rarity,
      element: element,
      weapon: weapon,
      releaseVersion: releaseVersion,
      imgUrl: imgUrl
    });
  }

  console.log(`Parsed ${characters.length} characters.`);
  
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
  }

  // 이미지 다운로드 및 로컬 경로 매핑
  const finalCharacters = [];
  for (const char of characters) {
    const fileName = `${char.id}.png`;
    const destPath = path.join(IMAGE_DIR, fileName);
    
    console.log(`Downloading image for ${char.name} (${char.enName})...`);
    try {
      if (fs.existsSync(destPath)) {
        console.log(`Image already exists: ${char.name}`);
      } else {
        await downloadImage(char.imgUrl, destPath);
        console.log(`Success: ${char.name}`);
      }
      
      finalCharacters.push({
        id: char.id,
        name: char.name,
        enName: char.enName,
        rarity: char.rarity,
        element: char.element,
        weapon: char.weapon,
        releaseVersion: char.releaseVersion,
        img: `/characters/${fileName}`
      });
    } catch (err) {
      console.error(`Failed to download image for ${char.name}:`, err.message);
      finalCharacters.push({
        id: char.id,
        name: char.name,
        enName: char.enName,
        rarity: char.rarity,
        element: char.element,
        weapon: char.weapon,
        releaseVersion: char.releaseVersion,
        img: `https://placehold.co/150/2e303a/ffffff?text=${char.enName}`
      });
    }
  }

  // JSON 파일로 저장
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(finalCharacters, null, 2), 'utf-8');
  console.log(`Saved character data to ${OUTPUT_JSON_PATH}`);
}

main().catch(console.error);

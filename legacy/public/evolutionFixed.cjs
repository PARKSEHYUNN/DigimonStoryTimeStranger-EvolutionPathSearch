// Node.js의 파일 시스템(fs) 모듈을 사용합니다.
const fs = require('fs');
const path = require('path');

// 입력 파일과 출력 파일의 경로를 정의합니다.
const inputFile = path.join(__dirname, 'digimon_list.json');
const outputFile = path.join(__dirname, 'digimon_list_fixed.json');

console.log('스크립트를 시작합니다...');

try {
  // 1. digimon_list.json 파일을 동기적으로 읽고 JSON으로 파싱합니다.
  const rawData = fs.readFileSync(inputFile, 'utf8');
  const digimons = JSON.parse(rawData);
  console.log(`총 ${digimons.length}개의 디지몬 데이터를 불러왔습니다.`);

  // 2. ID를 키로 사용하여 디지몬 객체에 빠르게 접근할 수 있도록 Map을 생성합니다.
  // 배열에서 find()를 반복 사용하는 것보다 훨씬 효율적입니다.
  const digimonMap = new Map(digimons.map((d) => [d.id, d]));
  console.log('빠른 조회를 위한 데이터 맵을 생성했습니다.');

  let fixesMade = 0;
  const fixedConnections = [];

  // 3. 모든 디지몬을 순회하며 진화 관계를 확인하고 수정합니다.
  console.log('진화 관계 상호 연결 검사를 시작합니다...');
  for (const currentDigimon of digimons) {
    const currentId = currentDigimon.id;
    const currentName = currentDigimon.name[1]; // 한국어 이름

    // 'to' (진화 후) 관계 확인
    if (
      currentDigimon.evolution &&
      Array.isArray(currentDigimon.evolution.to)
    ) {
      for (const evolutionToId of currentDigimon.evolution.to) {
        // Map에서 진화 후 디지몬 객체를 찾습니다.
        const nextDigimon = digimonMap.get(evolutionToId);

        if (nextDigimon) {
          const nextName = nextDigimon.name[1];
          // 진화 후 디지몬의 'from' 리스트에 현재 디지몬 ID가 있는지 확인합니다.
          if (
            nextDigimon.evolution &&
            Array.isArray(nextDigimon.evolution.from)
          ) {
            if (!nextDigimon.evolution.from.includes(currentId)) {
              // 연결이 누락된 경우, 'from' 리스트에 현재 디지몬 ID를 추가합니다.
              nextDigimon.evolution.from.push(currentId);
              fixesMade++;
              const fixLog = `[수정] ${currentName}(${currentId}) -> ${nextName}(${evolutionToId}) 관계에 대해, ${nextName}의 'from' 리스트에 ${currentId}를 추가했습니다.`;
              fixedConnections.push(fixLog);
            }
          }
        } else {
          console.warn(
            `[경고] ${currentName}(${currentId})의 진화 정보에 존재하지 않는 디지몬 ID(${evolutionToId})가 있습니다.`,
          );
        }
      }
    }
  }

  console.log('검사가 완료되었습니다.');

  // 4. 수정된 내용이 있다면, 결과를 새 파일에 저장합니다.
  if (fixesMade > 0) {
    console.log(`\n총 ${fixesMade}개의 누락된 진화 연결을 수정했습니다.`);
    fixedConnections.forEach((log) => console.log(log));

    // 수정된 digimons 배열을 다시 JSON 문자열로 변환합니다. (null, 2는 가독성을 위한 포맷팅)
    const updatedData = JSON.stringify(digimons, null, 2);
    fs.writeFileSync(outputFile, updatedData, 'utf8');
    console.log(
      `\n수정된 데이터가 "${outputFile}" 파일에 성공적으로 저장되었습니다.`,
    );
  } else {
    console.log(
      '\n모든 진화 관계가 완벽하게 연결되어 있습니다. 수정할 내용이 없습니다.',
    );
  }
} catch (error) {
  console.error('스크립트 실행 중 오류가 발생했습니다:', error);
}

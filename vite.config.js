import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function adminPlugin() {
  return {
    name: 'admin-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const filePath = path.resolve(__dirname, 'public/digimon_list.json');

        // 디지몬 추가
        if (req.url === '/___admin/api/digimon' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { incoming_requirements, isDlc, ...newDigimon } = JSON.parse(body);
              const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

              if (list.find((d) => d.id === newDigimon.id)) {
                res.writeHead(409, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '이미 존재하는 ID입니다.' }));
                return;
              }

              // 양방향 관계 자동 업데이트
              for (const fromId of newDigimon.evolution.from) {
                const fromDigi = list.find((d) => d.id === fromId);
                if (fromDigi && !fromDigi.evolution.to.includes(newDigimon.id)) {
                  fromDigi.evolution.to.push(newDigimon.id);
                }
              }
              for (const toId of newDigimon.evolution.to) {
                const toDigi = list.find((d) => d.id === toId);
                if (toDigi && !toDigi.evolution.from.includes(newDigimon.id)) {
                  toDigi.evolution.from.push(newDigimon.id);
                }
              }

              // 진화 전 조건: 각 from 디지몬의 evolution_requirements에 추가
              if (Array.isArray(incoming_requirements)) {
                for (const { fromId, conditions } of incoming_requirements) {
                  const fromDigi = list.find((d) => d.id === fromId);
                  if (fromDigi) {
                    if (!Array.isArray(fromDigi.evolution_requirements)) {
                      fromDigi.evolution_requirements = [];
                    }
                    if (!fromDigi.evolution_requirements.some((r) => r.id === newDigimon.id)) {
                      fromDigi.evolution_requirements.push({ id: newDigimon.id, conditions });
                    }
                  }
                }
              }

              list.push(newDigimon);
              list.sort((a, b) => a.id - b.id);
              fs.writeFileSync(filePath, JSON.stringify(list, null, 2));

              // DLC 여부 처리
              if (isDlc) {
                const dlcPath = path.resolve(__dirname, 'public/dlc_list.json');
                const dlcData = JSON.parse(fs.readFileSync(dlcPath, 'utf-8'));
                if (!dlcData.DLC.includes(newDigimon.id)) {
                  dlcData.DLC.push(newDigimon.id);
                  dlcData.DLC.sort((a, b) => a - b);
                  fs.writeFileSync(dlcPath, JSON.stringify(dlcData, null, 2));
                }
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, id: newDigimon.id }));
            } catch (e) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // 디지몬 수정
        const putMatch = req.url.match(/^\/___admin\/api\/digimon\/(\d+)$/);
        if (putMatch && req.method === 'PUT') {
          const targetId = Number(putMatch[1]);
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { incoming_requirements, isDlc, ...updatedDigimon } = JSON.parse(body);
              const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

              const existingIndex = list.findIndex((d) => d.id === targetId);
              if (existingIndex === -1) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '디지몬을 찾을 수 없습니다.' }));
                return;
              }

              const oldDigimon = list[existingIndex];
              const oldFrom = oldDigimon.evolution?.from || [];
              const oldTo = oldDigimon.evolution?.to || [];
              const newFrom = updatedDigimon.evolution?.from || [];
              const newTo = updatedDigimon.evolution?.to || [];

              // from 관계 변경 동기화
              for (const fromId of oldFrom) {
                if (!newFrom.includes(fromId)) {
                  const d = list.find((x) => x.id === fromId);
                  if (d) d.evolution.to = d.evolution.to.filter((id) => id !== targetId);
                }
              }
              for (const fromId of newFrom) {
                if (!oldFrom.includes(fromId)) {
                  const d = list.find((x) => x.id === fromId);
                  if (d && !d.evolution.to.includes(targetId)) d.evolution.to.push(targetId);
                }
              }

              // to 관계 변경 동기화
              for (const toId of oldTo) {
                if (!newTo.includes(toId)) {
                  const d = list.find((x) => x.id === toId);
                  if (d) d.evolution.from = d.evolution.from.filter((id) => id !== targetId);
                }
              }
              for (const toId of newTo) {
                if (!oldTo.includes(toId)) {
                  const d = list.find((x) => x.id === toId);
                  if (d && !d.evolution.from.includes(targetId)) d.evolution.from.push(targetId);
                }
              }

              // incoming_requirements 갱신: 기존 항목 전체 삭제 후 새로 추가
              for (const fromId of oldFrom) {
                const d = list.find((x) => x.id === fromId);
                if (d && Array.isArray(d.evolution_requirements)) {
                  d.evolution_requirements = d.evolution_requirements.filter((r) => r.id !== targetId);
                }
              }
              if (Array.isArray(incoming_requirements)) {
                for (const { fromId, conditions } of incoming_requirements) {
                  const d = list.find((x) => x.id === fromId);
                  if (d) {
                    if (!Array.isArray(d.evolution_requirements)) d.evolution_requirements = [];
                    d.evolution_requirements.push({ id: targetId, conditions });
                  }
                }
              }

              // DLC 갱신
              const dlcPath = path.resolve(__dirname, 'public/dlc_list.json');
              const dlcData = JSON.parse(fs.readFileSync(dlcPath, 'utf-8'));
              if (isDlc && !dlcData.DLC.includes(targetId)) {
                dlcData.DLC.push(targetId);
                dlcData.DLC.sort((a, b) => a - b);
                fs.writeFileSync(dlcPath, JSON.stringify(dlcData, null, 2));
              } else if (!isDlc && dlcData.DLC.includes(targetId)) {
                dlcData.DLC = dlcData.DLC.filter((id) => id !== targetId);
                fs.writeFileSync(dlcPath, JSON.stringify(dlcData, null, 2));
              }

              list[existingIndex] = updatedDigimon;
              list.sort((a, b) => a.id - b.id);
              fs.writeFileSync(filePath, JSON.stringify(list, null, 2));

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, id: targetId }));
            } catch (e) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // 최대 ID 조회
        if (req.url === '/___admin/api/digimon/maxid' && req.method === 'GET') {
          try {
            const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const ids = new Set(list.map((d) => d.id));
            const maxId = Math.max(...ids);
            const missingIds = [];
            for (let i = 1; i <= maxId; i++) {
              if (!ids.has(i)) missingIds.push(i);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ maxId, nextId: maxId + 1, count: list.length, missingIds }));
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), adminPlugin()],
});

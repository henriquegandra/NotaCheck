import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'public'));
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(express.urlencoded({ extended: true }));

// Configuração do Multer para uploads
const upload = multer({ dest: 'uploads/' });

// Página inicial
app.get('/', (req, res) => {
    res.render('index');
});

// Recebe upload dos arquivos
app.post('/upload', upload.fields([
    { name: 'nota', maxCount: 1 },
    { name: 'boleto', maxCount: 1 }
]), async (req, res) => {
    try {
        const { body, files } = req;
        const now = new Date();
        const dataHora = now.toISOString();
        let logTipo, nomeArquivo, arquivo, camposLog = [];

        // Salva Nota
        if (files.nota) {
            logTipo = 'NOTA';
            arquivo = files.nota[0];
            nomeArquivo = `${body['nota-vencimento']}_${body['nota-tipo']}_${body['nota-numero']}_${body['nota-fornecedor'] || ''}_${body['nota-pedido'] || ''}.pdf`.replace(/\s+/g, '');
            fs.renameSync(arquivo.path, path.join('uploads', nomeArquivo));
            camposLog = [
                dataHora, logTipo, body['nota-vencimento'], body['nota-recebimento'], body['nota-tipo'],
                body['nota-numero'], body['nota-fornecedor'], body['nota-pedido'] || '', 'PENDENTE'
            ];
            appendLog(camposLog);
        }

        // Salva Boleto
        if (files.boleto) {
            logTipo = 'BOLETO';
            arquivo = files.boleto[0];
            nomeArquivo = `${body['boleto-vencimento']}_BOLETO_${body['boleto-numero']}_${body['boleto-fornecedor'] || ''}_${body['boleto-pedido'] || ''}.pdf`.replace(/\s+/g, '');
            fs.renameSync(arquivo.path, path.join('uploads', nomeArquivo));
            camposLog = [
                dataHora, logTipo, body['boleto-vencimento'], body['boleto-recebimento'], '',
                body['boleto-numero'], body['boleto-fornecedor'], body['boleto-pedido'] || '', 'PENDENTE'
            ];
            appendLog(camposLog);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Função para adicionar ao log CSV
function appendLog(campos) {
    const logPath = path.join('archives', 'log.csv');
    const linha = campos.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',') + '\n';
    fs.mkdirSync('archives', { recursive: true });
    fs.appendFileSync(logPath, linha);
}

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
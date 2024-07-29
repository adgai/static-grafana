import {JSDOM} from 'jsdom';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import * as url from "node:url";

let dataUrl = 'http://localhost:3000/api/dashboards/uid/dds8i1mqqa680e';
let renderUrl = 'http://localhost:8081/render';
let data = [];
let dashboardId = 'dds8i1mqqa680e'
let originId = 1
let dashboardName = 'new-dashboard'
let from  = 1721736889194
let to = 1721738490788
let theme  = 'light'
let width = 1200
let height = 200

function generateGrafanaDashboardData(): Array<Array<any>> {
    let ar: Array<Array<any>> = [];
    let index = 0;
    let end = 0;
    let lastType = data[0]?.type ?? '';

    for (let j = 0; j < data.length; j++) {
        if (lastType === (data[j]?.type ?? '')) {
            end = j;
        } else {
            ar.push(data.slice(index, end + 1));
            index = j;
            end = j;
            lastType = data[j]?.type ?? '';
        }
    }

    ar.push(data.slice(index, end + 1)); // Add the last slice
    console.log(JSON.stringify(ar));
    return ar;
}

function genHtml(ar: Array<Array<any>>) {
    const originalIndexFilePath = path.join('./DashBoardTemplate.html');
    const indexHtml = fs.readFileSync(originalIndexFilePath, 'utf-8');
    const dom = new JSDOM(indexHtml);
    const document = dom.window.document;
    let container = document.createElement('div');
    container.classList.add('dashboard-container');

    let heightUnit = 40
    let widthUnit = 2400 / 24

    ar.forEach(d => {
        if (d[0]?.type === 'row') {
            d.forEach(di => {
                let rowDiv = document.createElement('div');
                let span = document.createElement('span');
                span.textContent = di.title;
                rowDiv.appendChild(span);
                rowDiv.classList.add('row');

                rowDiv.style.transform = `translate(${di.gridPos.x * widthUnit}px, ${di.gridPos.y * heightUnit}px)`;

                container.appendChild(rowDiv);
            });
        } else {
            d.forEach(dx => {
                let panelDiv = document.createElement('div');
                // let span = document.createElement('span');
                let panelContent = document.createElement('div');
                panelContent.classList.add('panel-content');

                let panelId = dx.id;
                let path1 = `../disk/img-${panelId}.png`;

                let panelUrl = `http://localhost:3000/d-solo/${dashboardId}/${dashboardName}?panelId=${panelId}&orgId=1&render=1&viewPanel=&from=${from}&to=${to}&theme=${theme}`

                renderImg(panelUrl).then(value => {
                    const writer = fs.createWriteStream(path1);
                    value.pipe(writer);
                })

                let img = document.createElement('img');
                img.src = path1
                img.classList.add('panel-img');
                img.classList.add('data-zoomable')
                panelContent.appendChild(img)

                // span.textContent = dx.title;
                // panelDiv.appendChild(span);
                panelDiv.appendChild(panelContent)
                panelDiv.style.position = 'absolute'

                // panelDiv.style.backgroundColor = 'gray'

                panelDiv.classList.add('panel');
                panelDiv.style.width = dx.gridPos.w * widthUnit + 'px';
                panelDiv.style.height = dx.gridPos.h * heightUnit + 'px';
                panelDiv.style.transform = `translate(${dx.gridPos.x * widthUnit}px, ${dx.gridPos.y * heightUnit}px)`;
                container.appendChild(panelDiv);
            });
        }
    });

    const articleElement = document.getElementById('article');
    if (articleElement) {
        articleElement.innerHTML = ''; // 清空之前的内容
        articleElement.appendChild(container);
    }

    const diskDirectory = path.join('../disk');
    const outputIndexFilePath = path.join(diskDirectory, 'index.html');
    fs.writeFileSync(outputIndexFilePath, dom.serialize(), 'utf-8');
}

function genD() {
    let data1 = getData();
    data1.then(value => {
        data = value.dashboard.panels
        const ar = generateGrafanaDashboardData();
        genHtml(ar);
    })

}

async function fetchData(url: string): Promise<any> {
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': 'Bearer glsa_5y1sSxJxR9hNEks2cbtAJnYfQEBuAkk6_cbbfbe80'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Axios GET error:', error);
    }
}

// 使用示例
const getData = async () => {

    return await fetchData(dataUrl)
};

async function renderImg(url: string): Promise<any> {
    let response = await axios.get(renderUrl, {
        headers: {
            'X-Auth-Token': '-'
        },
        responseType: 'stream',
        params: {
            url: url,
            domain: 'localhost',
            width: width,
            height: height,
        }
    });

    return response.data;
}

genD();

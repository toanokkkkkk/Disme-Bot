module.exports.config = {
    name: "pinterest",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "ChatGPT",
    description: "Tìm kiếm ảnh trên Pinterest",
    commandCategory: "media",
    usages: "[text] [số lượng]",
    cooldowns: 5,
    dependencies: {
        "request": "",
        "fs-extra": "",
        "axios": ""
    }
};

module.exports.run = async function({ api, event, args }) {
    try {
        const request = global.nodemodule["request"];
        const fs = global.nodemodule["fs-extra"];
        const axios = global.nodemodule["axios"];

        if (!args[0]) {
            return api.sendMessage("❌ Vui lòng nhập từ khóa tìm kiếm!", event.threadID, event.messageID);
        }
        
        const keySearch = args.join(" ");
        const numberSearch = Math.min(parseInt(args[args.length-1]) || 6, 10); // Giới hạn tối đa 10 ảnh

        const headers = {
            'authority': 'www.pinterest.com',
            'cache-control': 'max-age=0',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
            'accept-language': 'en-US,en;q=0.9'
        };

        const options = {
            url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(keySearch)}`,
            headers: headers,
            timeout: 10000 // 10s timeout
        };

        const waitingMessage = await api.sendMessage(
            `📝 Đang xử lý yêu cầu...\n❓ Từ khóa: ${keySearch}\n🔢 Số lượng: ${numberSearch}`, 
            event.threadID
        );

        request(options, async (error, response, body) => {
            try {
                if (error) throw new Error(`Lỗi request: ${error.message}`);
                if (response.statusCode !== 200) throw new Error(`Lỗi status code: ${response.statusCode}`);

                const imgMatches = body.match(/https:\/\/i\.pinimg\.com\/originals\/[^.]+\.(?:jpg|png|gif)/g) || [];
                if (imgMatches.length === 0) {
                    return api.sendMessage('❌ Không tìm thấy kết quả nào!', event.threadID, event.messageID);
                }

                const imgData = [];
                let successCount = 0;
                const downloadPromises = [];

                // Download images concurrently
                for (let i = 0; i < numberSearch && i < imgMatches.length; i++) {
                    const path = __dirname + `/cache/pinterest_${i}.jpg`;
                    downloadPromises.push(
                        axios.get(imgMatches[i], { 
                            responseType: 'arraybuffer',
                            timeout: 5000 // 5s timeout per image
                        })
                        .then(response => {
                            fs.writeFileSync(path, Buffer.from(response.data, 'binary'));
                            imgData.push(fs.createReadStream(path));
                            successCount++;
                        })
                        .catch(err => console.error(`Lỗi tải ảnh ${i + 1}:`, err.message))
                    );
                }

                await Promise.all(downloadPromises);

                if (successCount === 0) {
                    throw new Error('Không thể tải bất kỳ ảnh nào!');
                }

                // Delete waiting message
                api.unsendMessage(waitingMessage.messageID);

                // Send results
                return api.sendMessage({
                    body: `🎯 Kết quả tìm kiếm cho "${keySearch}"\n✅ Tải thành công: ${successCount}/${numberSearch} ảnh`,
                    attachment: imgData
                }, event.threadID, (err) => {
                    // Cleanup cache
                    for (let i = 0; i < numberSearch; i++) {
                        const path = __dirname + `/cache/pinterest_${i}.jpg`;
                        if (fs.existsSync(path)) fs.unlinkSync(path);
                    }
                }, event.messageID);

            } catch (err) {
                api.sendMessage(`❌ Đã xảy ra lỗi: ${err.message}`, event.threadID, event.messageID);
            }
        });

    } catch (err) {
        console.error(err);
        return api.sendMessage('❌ Đã xảy ra lỗi không mong muốn!', event.threadID, event.messageID);
    }
};
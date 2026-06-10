require('dotenv').config();
const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, Events 
} = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// เมื่อบอทออนไลน์
client.once(Events.ClientReady, async (c) => {
    console.log(`✅ บอท ${c.user.tag} พร้อมทำงานแล้ว!`);

    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) return console.log('❌ หาห้องไม่เจอ ตรวจสอบ CHANNEL_ID ใน .env');

    // สร้างปุ่ม
    const button = new ButtonBuilder()
        .setCustomId('register_btn')
        .setLabel('คลิกเพื่อลงทะเบียนเข้าชมรม')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🌿');

    const row = new ActionRowBuilder().addComponents(button);

    // เช็คว่าเคยส่งปุ่มไปหรือยัง จะได้ไม่ส่งซ้ำ
    const messages = await channel.messages.fetch({ limit: 10 });
    const hasButton = messages.some(msg => msg.components.length > 0);

    if (!hasButton) {
        await channel.send({ 
            content: 'ยินดีต้อนรับ! กรุณากดปุ่มด้านล่างเพื่อตั้งชื่อและเข้าสู่เซิร์ฟเวอร์', 
            components: [row] 
        });
    }
});

// เมื่อมีการโต้ตอบ (กดปุ่ม หรือ กด Submit Modal)
client.on(Events.InteractionCreate, async (interaction) => {
    
    // 1. ถ้าผู้ใช้กดปุ่มลงทะเบียน -> ให้แสดง Modal
    if (interaction.isButton() && interaction.customId === 'register_btn') {
        const modal = new ModalBuilder()
            .setCustomId('register_modal')
            .setTitle('ฟอร์มลงทะเบียนชมรมอนุรักษ์');

        // ช่องกรอกชื่อค่าย
        const campInput = new TextInputBuilder()
            .setCustomId('camp_input')
            .setLabel("ชื่อค่าย (เช่น ผาแต้ม ทุ่งใหญ่)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // ช่องกรอกชื่อเล่น
        const nameInput = new TextInputBuilder()
            .setCustomId('name_input')
            .setLabel("ชื่อเล่น")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // ใส่ช่องกรอกลงใน ActionRow
        const firstActionRow = new ActionRowBuilder().addComponents(campInput);
        const secondActionRow = new ActionRowBuilder().addComponents(nameInput);

        modal.addComponents(firstActionRow, secondActionRow);

        // แสดง Modal ขึ้นมาบนจอ
        await interaction.showModal(modal);
    }

    // 2. ถ้าผู้ใช้กด Submit Modal ส่งข้อมูลมา
    if (interaction.isModalSubmit() && interaction.customId === 'register_modal') {
        const campName = interaction.fields.getTextInputValue('camp_input');
        const nickName = interaction.fields.getTextInputValue('name_input');
        
        // ประกอบร่างชื่อใหม่
        const newNickname = `[${campName}] ${nickName}`;

        try {
            // เปลี่ยนชื่อ
            await interaction.member.setNickname(newNickname);
            // ให้ยศ Member
            await interaction.member.roles.add(process.env.ROLE_ID);

            // ตอบกลับแบบเห็นคนเดียว (Ephemeral)
            await interaction.reply({ 
                content: `✅ ยืนยันตัวตนสำเร็จ! เปลี่ยนชื่อเป็น **${newNickname}** เรียบร้อยแล้ว ไปคุยที่ห้องอื่นได้เลยครับ`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error(error);
            // ดัก Error กรณีบอทยศต่ำกว่าคนโดนเปลี่ยนชื่อ หรือไม่มีสิทธิ์
            await interaction.reply({ 
                content: '❌ เกิดข้อผิดพลาดในการเปลี่ยนชื่อ กรุณาติดต่อ Admin ครับ', 
                ephemeral: true 
            });
        }
    }
});

client.login(process.env.BOT_TOKEN);
// --- โค้ดสำหรับเลี้ยงบอทบน Render ---
const http = require('http');
http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);
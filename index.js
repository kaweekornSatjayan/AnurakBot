require('dotenv').config();
const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    StringSelectMenuBuilder, Events 
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

// เมื่อมีการโต้ตอบ (กดปุ่ม, กด Submit Modal หรือ เลือก Dropdown)
client.on(Events.InteractionCreate, async (interaction) => {
    
    // --------------------------------------------------
    // สเต็ปที่ 1: ถ้าผู้ใช้กดปุ่มลงทะเบียน -> ให้แสดง Modal
    // --------------------------------------------------
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

    // --------------------------------------------------
    // สเต็ปที่ 2: ถ้าผู้ใช้กด Submit Modal ส่งข้อมูลมา
    // --------------------------------------------------
    if (interaction.isModalSubmit() && interaction.customId === 'register_modal') {
        const campName = interaction.fields.getTextInputValue('camp_input');
        const nickName = interaction.fields.getTextInputValue('name_input');
        
        // ประกอบร่างชื่อใหม่
        const newNickname = `[${campName}] ${nickName}`;

        try {
            // เปลี่ยนชื่อ
            await interaction.member.setNickname(newNickname);
            
            // ให้ยศ Member หลัก (เพื่อให้มองเห็นห้องอื่นๆ)
            await interaction.member.roles.add(process.env.ROLE_ID);

            // สร้างเมนู Dropdown ให้เลือกสายที่สนใจ
            const roleSelect = new StringSelectMenuBuilder()
                .setCustomId('role_select_menu')
                .setPlaceholder('คลิกเพื่อเลือกสายที่คุณสนใจ (เลือกได้มากกว่า 1)')
                .setMinValues(1)
                .setMaxValues(2) // อนุญาตให้เลือกได้สูงสุด 2 อัน
                .addOptions(
                    {
                        label: 'สายดูนก (Bird Watcher)',
                        description: 'รับยศนี้เพื่อเข้าห้องแชร์พิกัดและคุยเรื่องดูนก',
                        emoji: '🦅',
                        value: process.env.ROLE_ID_2 // ใช้ ID ยศที่ 2 จาก .env
                    },
                    {
                        label: 'สายถ่ายภาพ (Photographer)',
                        description: 'รับยศนี้เพื่อเข้าห้องแชร์เทคนิคถ่ายรูปและแต่งรูป',
                        emoji: '📸',
                        value: process.env.ROLE_ID_3 // ใช้ ID ยศที่ 3 จาก .env
                    }
                );

            const row = new ActionRowBuilder().addComponents(roleSelect);

            // ตอบกลับแบบเห็นคนเดียว พร้อมแนบ Dropdown ไปด้วย
            await interaction.reply({ 
                content: `✅ เปลี่ยนชื่อเป็น **${newNickname}** เรียบร้อย!\n\n**ขั้นตอนสุดท้าย:** โปรดเลือกสายความสนใจของคุณด้านล่างนี้ครับ 👇`, 
                components: [row],
                ephemeral: true 
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: '❌ เกิดข้อผิดพลาดในการเปลี่ยนชื่อ กรุณาติดต่อ Admin ครับ (เช็คลำดับยศบอทด้วยนะ!)', 
                ephemeral: true 
            });
        }
    }

    // --------------------------------------------------
    // สเต็ปที่ 3: ดักจับตอนที่สมาชิกกดเลือกเมนู Dropdown
    // --------------------------------------------------
    if (interaction.isStringSelectMenu() && interaction.customId === 'role_select_menu') {
        try {
            // ดึงค่า ID ของยศที่สมาชิกเลือก (มาเป็น Array)
            const selectedRoles = interaction.values;

            // มอบยศที่เลือกให้สมาชิก
            await interaction.member.roles.add(selectedRoles);

            // อัปเดตข้อความเพื่อลบ Dropdown ออกและแจ้งว่าเสร็จสิ้น
            await interaction.update({ 
                content: '🎉 ยืนยันตัวตนสมบูรณ์! มอบยศตามความสนใจเรียบร้อยแล้ว เข้าไปพูดคุยในห้องต่างๆ ได้เลยครับ', 
                components: [] // ใส่ Array ว่างเพื่อลบ Dropdown ทิ้ง
            });
        } catch (error) {
            console.error(error);
            // ใช้ followUp เผื่อว่า update พัง จะได้ยังแจ้งเตือนได้
            await interaction.followUp({ 
                content: '❌ เกิดข้อผิดพลาดในการมอบยศ กรุณาติดต่อ Admin ครับ', 
                ephemeral: true 
            });
        }
    }
});

client.login(process.env.BOT_TOKEN);

// --- โค้ดสำหรับเลี้ยงบอทบน Render ---
const http = require('http');
http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);
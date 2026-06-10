require('dotenv').config();
const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, 
    StringSelectMenuBuilder, Events 
} = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // จำเป็นมากสำหรับดักจับคนเข้าใหม่
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// --------------------------------------------------
// 1. เมื่อบอทออนไลน์ ให้เช็คว่ามีปุ่มหรือยัง
// --------------------------------------------------
client.once(Events.ClientReady, async (c) => {
    console.log(`✅ บอท ${c.user.tag} พร้อมทำงานแล้ว!`);

    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) return console.log('❌ หาห้องไม่เจอ ตรวจสอบ CHANNEL_ID ใน .env');

    const button = new ButtonBuilder()
        .setCustomId('register_btn')
        .setLabel('คลิกเพื่อลงทะเบียนเข้าชมรม')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🌿');

    const row = new ActionRowBuilder().addComponents(button);

    // เช็คว่าห้องว่างเปล่าไหม ถ้าว่างให้ส่งปุ่มทิ้งไว้ 1 อัน
    const messages = await channel.messages.fetch({ limit: 10 });
    const hasButton = messages.some(msg => msg.components.length > 0);

    if (!hasButton) {
        await channel.send({ 
            content: 'ยินดีต้อนรับ! กรุณากดปุ่มด้านล่างเพื่อตั้งชื่อและเข้าสู่เซิร์ฟเวอร์', 
            components: [row] 
        });
    }
});

// --------------------------------------------------
// 🌟 2. [เพิ่มใหม่] เมื่อมีคนเข้าเซิร์ฟเวอร์ ให้แท็กเรียกและส่งปุ่มให้
// --------------------------------------------------
client.on(Events.GuildMemberAdd, async (member) => {
    const channel = member.guild.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) return;

    const button = new ButtonBuilder()
        .setCustomId('register_btn')
        .setLabel('คลิกเพื่อลงทะเบียนเข้าชมรม')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🌿');

    const row = new ActionRowBuilder().addComponents(button);

    // บอทจะแท็กชื่อคนที่พึ่งเข้ามาใหม่
    await channel.send({ 
        content: `👋 ยินดีต้อนรับ ${member}! รบกวนกดปุ่มด้านล่างนี้เพื่อกรอกข้อมูลเข้าชมรมนะครับ 👇`, 
        components: [row] 
    });
});

// --------------------------------------------------
// 3. เมื่อมีการกดปุ่ม, กด Submit หรือ เลือก Dropdown
// --------------------------------------------------
client.on(Events.InteractionCreate, async (interaction) => {
    
    // สเต็ปที่ 1: กดปุ่มลงทะเบียน -> แสดง Modal
    if (interaction.isButton() && interaction.customId === 'register_btn') {
        const modal = new ModalBuilder()
            .setCustomId('register_modal')
            .setTitle('ฟอร์มลงทะเบียนชมรมอนุรักษ์');

        const campInput = new TextInputBuilder()
            .setCustomId('camp_input')
            .setLabel("ชื่อค่าย (เช่น ผาแต้ม ทุ่งใหญ่)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const nameInput = new TextInputBuilder()
            .setCustomId('name_input')
            .setLabel("ชื่อเล่น")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(campInput), 
            new ActionRowBuilder().addComponents(nameInput)
        );

        await interaction.showModal(modal);
    }

    // สเต็ปที่ 2: กด Submit Modal -> เปลี่ยนชื่อ, ให้ยศหลัก, โชว์ Dropdown
    if (interaction.isModalSubmit() && interaction.customId === 'register_modal') {
        const campName = interaction.fields.getTextInputValue('camp_input');
        const nickName = interaction.fields.getTextInputValue('name_input');
        const newNickname = `[${campName}] ${nickName}`;

        try {
            await interaction.member.setNickname(newNickname);
            await interaction.member.roles.add(process.env.ROLE_ID);

            const roleSelect = new StringSelectMenuBuilder()
                .setCustomId('role_select_menu')
                .setPlaceholder('เลือกแก๊งค์กันเร้ว')
                .setMinValues(1)
                .setMaxValues(2)
                .addOptions(
                    {
                        label: 'แก๊งค์อนุรักษ์69',
                        description: 'สมาชิกปีการศึกษา69',
                        value: process.env.ROLE_ID
                    },
                    {
                        label: 'แก๊งค์อนุรักษ์รุ่นโต๋',
                        description: 'ศิษย์เก่า and the gang',
                        value: process.env.ROLE_ID_2
                    },
                    {
                        label: 'แก๊งค์บอด69',
                        description: 'ลู้มือ',
                        value: process.env.ROLE_ID_3
                    }
                );

            const row = new ActionRowBuilder().addComponents(roleSelect);

            await interaction.reply({ 
                content: `✅ เปลี่ยนชื่อเป็น **${newNickname}** เรียบร้อย!\n\n**ขั้นตอนสุดท้าย:** โปรดเลือกสายความสนใจของคุณด้านล่างนี้ครับ 👇`, 
                components: [row],
                ephemeral: true 
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: '❌ เกิดข้อผิดพลาดในการเปลี่ยนชื่อ กรุณาติดต่อ Admin ครับ', 
                ephemeral: true 
            });
        }
    }

    // สเต็ปที่ 3: กดเลือกเมนู Dropdown -> ให้ยศตามสาย
    if (interaction.isStringSelectMenu() && interaction.customId === 'role_select_menu') {
        try {
            const selectedRoles = interaction.values;
            await interaction.member.roles.add(selectedRoles);

            await interaction.update({ 
                content: '🎉 ยืนยันตัวตนสมบูรณ์! มอบยศตามความสนใจเรียบร้อยแล้ว เข้าไปพูดคุยในห้องต่างๆ ได้เลยครับ', 
                components: [] 
            });
        } catch (error) {
            console.error(error);
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
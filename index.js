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
    console.log(`🔎 กำลังตรวจสอบช่อง ${process.env.CHANNEL_ID} เพื่อส่งปุ่มลงทะเบียน`);

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
    console.log(`📥 GuildMemberAdd event: ${member.user.tag}`);
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
        content: `👋 ยินดีต้อนรับ ${member}! รบกวนกดปุ่มด้านล่างนี้เพื่อกรอกข้อมูลเข้าชมรมน้าา 👇`, 
        components: [row] 
    });
});

// --------------------------------------------------
// 3. เมื่อมีการกดปุ่ม, กด Submit หรือ เลือก Dropdown
// --------------------------------------------------
client.on(Events.InteractionCreate, async (interaction) => {
    
    // สเต็ปที่ 1: กดปุ่มลงทะเบียน -> เลือกค่าย+ปี หรือศิษย์เก่า
    if (interaction.isButton() && interaction.customId === 'register_btn') {
        const campSelect = new StringSelectMenuBuilder()
            .setCustomId('camp_select_menu')
            .setPlaceholder('มาจากค่ายไหนน (ถ้าจบแล้วให้ใส่ปีที่จบน้า)')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
                { label: 'ดิ๊งด่อง 66', description: 'เลือกค่าย 66', value: 'ดิ๊งด่อง 66' },
                { label: 'ทุ่งกิ๊ก 66', description: 'เลือกค่าย 66', value: 'ทุ่งกิ๊ก 66' },
                { label: 'น้ำตกหงาว 66', description: 'เลือกค่าย 66', value: 'น้ำตกหงาว 66' },
                { label: 'กุยบุรี 67', description: 'เลือกค่าย 67', value: 'กุยบุรี 67' },
                { label: 'ผาแดง 67', description: 'เลือกค่าย 67', value: 'ผาแดง 67' },
                { label: 'แก่งกระจาน 67', description: 'เลือกค่าย 67', value: 'แก่งกระจาน 67' },
                { label: 'แม่เมย 67', description: 'เลือกค่าย 67', value: 'แม่เมย 67' },
                { label: 'เขาแหลม 68', description: 'เลือกค่าย 68', value: 'เขาแหลม 68' },
                { label: 'ผาแต้ม 68', description: 'เลือกค่าย 68', value: 'ผาแต้ม 68' },
                { label: 'ทุ่งใหญ่ 68', description: 'เลือกค่าย 68', value: 'ทุ่งใหญ่ 68' },
                { label: 'จบแล้วว (ระบุปีที่จบ)', description: 'กรอกปีที่จบเอง', value: 'alumni' }
            );

        const row = new ActionRowBuilder().addComponents(campSelect);

        await interaction.reply({ 
            content: 'กรุณาเลือกค่าย+ปี หรือศิษย์เก่า แล้วกรอกชื่อเล่นในขั้นตอนถัดไป', 
            components: [row],
            ephemeral: true
        });
        return;
    }

    // สเต็ปที่ 2: เลือกค่าย+ปีหรือศิษย์เก่า -> แสดง Modal เพื่อกรอกชื่อ
    if (interaction.isStringSelectMenu() && interaction.customId === 'camp_select_menu') {
        const selectedCamp = interaction.values[0];
        const modal = new ModalBuilder()
            .setCustomId(`register_modal:${selectedCamp}`)
            .setTitle('ฟอร์มลงทะเบียนชมรมอนุรักษ์');

        const nameInput = new TextInputBuilder()
            .setCustomId('name_input')
            .setLabel('ชื่อเล่น / ชื่อที่ต้องการให้ตั้ง')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(nameInput));

        if (selectedCamp === 'alumni') {
            const gradYearInput = new TextInputBuilder()
                .setCustomId('grad_year_input')
                .setLabel('ปีที่จบ (เช่น 63, 64, 65)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(gradYearInput));
        }

        await interaction.showModal(modal);
        return;
    }

    // สเต็ปที่ 3: กด Submit Modal -> เปลี่ยนชื่อ, ให้ยศหลัก, โชว์ Dropdown
    if (interaction.isModalSubmit() && interaction.customId.startsWith('register_modal:')) {
        const selectedYear = interaction.customId.split(':')[1];
        const nickName = interaction.fields.getTextInputValue('name_input');
        const yearPrefix = selectedYear === 'alumni'
            ? interaction.fields.getTextInputValue('grad_year_input')
            : selectedYear;
        const newNickname = `[${yearPrefix}] ${nickName}`;

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
                        label: 'แก๊งค์พี่กระทิง(ศิษย์เก่า)',
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
                content: `✅ เปลี่ยนชื่อเป็น **${newNickname}** เรียบร้อย!\n\n**ขั้นตอนสุดท้าย:** แก๊งค์ไหนอะเรา จิ้มๆเลือกมาซิ👇`, 
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
                content: '🎉 ยืนยันตัวตนสมบูรณ์! เข้าไปพูดคุยในห้องต่างๆ ได้เลยย', 
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
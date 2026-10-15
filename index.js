require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    StringSelectMenuBuilder, 
    Events 
} = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

client.on('error', error => console.error('❌ เกิด Error ที่ตัว Client:', error));
client.on('shardError', error => console.error('❌ เกิดปัญหาการเชื่อมต่อ Websocket:', error));

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`✅ Bot \${readyClient.user.tag} is online and ready!`);

    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) return console.error('❌ Channel not found.');

    const registerBtn = new ButtonBuilder()
        .setCustomId('register_btn')
        .setLabel('คลิกเพื่อลงทะเบียนเข้าชมรม')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🌿');

    try {
        const messages = await channel.messages.fetch({ limit: 10 });
        const hasButton = messages.some(msg => msg.components.length > 0);

        if (!hasButton) {
            await channel.send({ 
                content: 'ยินดีต้อนรับ! กรุณากดปุ่มด้านล่างเพื่อตั้งชื่อและเข้าสู่เซิร์ฟเวอร์', 
                components: [new ActionRowBuilder().addComponents(registerBtn)] 
            });
        }
    } catch (error) {
        console.error('❌ Error deploying button:', error);
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    const channel = member.guild.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) return;

    const registerBtn = new ButtonBuilder()
        .setCustomId('register_btn')
        .setLabel('คลิกเพื่อลงทะเบียนเข้าชมรม')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🌿');

    try {
        await channel.send({ 
            content: `👋 ยินดีต้อนรับ \${member}! รบกวนกดปุ่มด้านล่างนี้เพื่อกรอกข้อมูลเข้าชมรมน้าา 👇`, 
            components: [new ActionRowBuilder().addComponents(registerBtn)] 
        });
    } catch (error) {
        console.error(`❌ Failed welcome message:`, error);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    
    // Step 1: ปุ่มลงทะเบียน -> แสดง Dropdown เลือกค่าย
    if (interaction.isButton() && interaction.customId === 'register_btn') {
        const campSelectMenu = new StringSelectMenuBuilder()
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
                { label: 'ซับลังกา 69', description: 'เลือกค่าย 69', value: 'ซับลังกา 69' },
                { label: 'ดูนก', description: 'ดูนก', value: 'ดูนก' },
                { label: 'จบแล้วว (ระบุปีที่จบ)', description: 'กรอกปีที่จบเอง', value: 'alumni' }
            );

        return await interaction.reply({ 
            content: 'กรุณาเลือกค่าย+ปี หรือศิษย์เก่า แล้วกรอกชื่อเล่นในขั้นตอนถัดไป', 
            components: [new ActionRowBuilder().addComponents(campSelectMenu)],
            ephemeral: true
        });
    }

    // Step 2: เลือกค่าย -> เปิด Modal ตั้งชื่อ
    if (interaction.isStringSelectMenu() && interaction.customId === 'camp_select_menu') {
        const selectedCamp = interaction.values[0];
        
        const modal = new ModalBuilder()
            .setCustomId(`register_modal:\${selectedCamp}`)
            .setTitle('ฟอร์มลงทะเบียนชมรมอนุรักษ์');

        const nicknameInput = new TextInputBuilder()
            .setCustomId('name_input')
            .setLabel('ตั้งชื่อค้าบ')
            .setPlaceholder('กรอกชื่อเล่น เช่น เซ่นซีวิก')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(nicknameInput));

        if (selectedCamp === 'alumni') {
            const gradYearInput = new TextInputBuilder()
                .setCustomId('grad_year_input')
                .setLabel('ปีที่จบ (เช่น 63, 64, 65)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(gradYearInput));
        }

        return await interaction.showModal(modal);
    }

    // Step 3: ส่ง Modal -> เปลี่ยนชื่อโดยมี [ชื่อค่าย] นำหน้า
    if (interaction.isModalSubmit() && interaction.customId.startsWith('register_modal:')) {
        await interaction.deferReply({ ephemeral: true });

        const selectedCamp = interaction.customId.split(':')[1];
        const nickname = interaction.fields.getTextInputValue('name_input');
        
        const prefix = selectedCamp === 'alumni'
            ? interaction.fields.getTextInputValue('grad_year_input')
            : selectedCamp === 'ดูนก'
                ? 'ดูนก'
                : selectedCamp;

        // 🟢 รวม Prefix ชื่อค่าย + ชื่อเล่น (จำกัดความยาวรวมไม่เกิน 32 ตัวอักษร)
        const newNickname = `[${prefix}]${nickname}`.slice(0, 32);

        try {
            await interaction.member.setNickname(newNickname);

            if (process.env.ROLE_ID) {
                await interaction.member.roles.add(process.env.ROLE_ID);
            }

            const role1 = process.env.ROLE_ID || 'role_1';
            const role2 = process.env.ROLE_ID_2 || 'role_2';
            const role3 = process.env.ROLE_ID_3 || 'role_3';
            const role4 = process.env.ROLE_ID_4 || 'role_4';

            const gangSelectMenu = new StringSelectMenuBuilder()
                .setCustomId('role_select_menu')
                .setPlaceholder('เลือกแก๊งค์กันเร้ว')
                .setMinValues(1)
                .setMaxValues(2)
                .addOptions(
                    { label: 'แก๊งค์อนุรักษ์69', description: 'สมาชิกปีการศึกษา69', value: role1 },
                    { label: 'แก๊งค์พี่กระทิง(ศิษย์เก่า)', description: 'ศิษย์เก่า and the gang', value: role2 !== role1 ? role2 : `\${role2}_fallback` },
                    { label: 'แก๊งค์บอด69', description: 'ลู้มือ', value: role3 !== role1 && role3 !== role2 ? role3 : `\${role3}_fallback` },
                    { label: 'ดูนก', description: 'ให้ยศดูนก', value: role4 !== role1 && role4 !== role2 && role4 !== role3 ? role4 : `\${role4}_fallback` }
                );

            return await interaction.editReply({ 
                content: `✅ เปลี่ยนชื่อเป็น **\${newNickname}** เรียบร้อย!\n\n**ขั้นตอนสุดท้าย:** แก๊งค์ไหนอะเรา จิ้มๆเลือกมาซิ👇`, 
                components: [new ActionRowBuilder().addComponents(gangSelectMenu)]
            });

        } catch (error) {
            console.error('❌ Error Step 3:', error);
            return await interaction.editReply({ 
                content: `❌ เกิดข้อผิดพลาดในการเปลี่ยนชื่อ: \`${error.message}\``
            });
        }
    }

    // Step 4: เลือกแก๊งค์ -> มอบยศ
    if (interaction.isStringSelectMenu() && interaction.customId === 'role_select_menu') {
        await interaction.deferUpdate();

        try {
            const selectedRoles = interaction.values.filter(roleId => !roleId.includes('_fallback') && !roleId.startsWith('role_'));
            
            if (selectedRoles.length > 0) {
                await interaction.member.roles.add(selectedRoles);
            }

            return await interaction.editReply({ 
                content: '🎉 ยืนยันตัวตนสมบูรณ์! เข้าไปพูดคุยในห้องต่างๆ ได้เลยย', 
                components: [] 
            });
        } catch (error) {
            console.error('❌ Error Step 4:', error);
            return await interaction.followUp({ 
                content: `❌ เกิดข้อผิดพลาดในการมอบยศ: \`${error.message}\``, 
                ephemeral: true 
            });
        }
    }
});

client.login(process.env.BOT_TOKEN).catch(error => console.error('❌ Login error:', error.message));

const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive and running!\n');
}).listen(PORT, () => console.log(`🌐 Health check server listening on port ${PORT}`));
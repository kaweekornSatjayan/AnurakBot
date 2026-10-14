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

// Initialize Discord Client with required intents
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Required for GuildMemberAdd event
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// =====================================================================
// Error & Debug Listeners
// =====================================================================
client.on('error', error => {
    console.error('❌ เกิด Error ที่ตัว Client:', error);
});

client.on('shardError', error => {
    console.error('❌ เกิดปัญหาการเชื่อมต่อ Websocket:', error);
});

client.on('debug', info => {
    console.log('⚙️ [Debug]:', info);
});

// =====================================================================
// Event: Client Ready
// =====================================================================
client.once(Events.ClientReady, async (readyClient) => {
    console.log(`✅ Bot \${readyClient.user.tag} is online and ready!`);
    console.log(`🔎 Checking channel \${process.env.CHANNEL_ID} for the registration button...`);

    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) {
        return console.error('❌ Channel not found. Please verify CHANNEL_ID in the .env file.');
    }

    const registerBtn = new ButtonBuilder()
        .setCustomId('register_btn')
        .setLabel('คลิกเพื่อลงทะเบียนเข้าชมรม')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🌿');

    const actionRow = new ActionRowBuilder().addComponents(registerBtn);

    try {
        const messages = await channel.messages.fetch({ limit: 10 });
        const hasButton = messages.some(msg => msg.components.length > 0);

        if (!hasButton) {
            await channel.send({ 
                content: 'ยินดีต้อนรับ! กรุณากดปุ่มด้านล่างเพื่อตั้งชื่อและเข้าสู่เซิร์ฟเวอร์', 
                components: [actionRow] 
            });
            console.log('✅ Registration button deployed successfully.');
        }
    } catch (error) {
        console.error('❌ Error fetching messages or sending button:', error);
    }
});

// =====================================================================
// Event: Guild Member Add
// =====================================================================
client.on(Events.GuildMemberAdd, async (member) => {
    console.log(`📥 GuildMemberAdd event triggered for: \${member.user.tag}`);
    
    const channel = member.guild.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) return;

    const registerBtn = new ButtonBuilder()
        .setCustomId('register_btn')
        .setLabel('คลิกเพื่อลงทะเบียนเข้าชมรม')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🌿');

    const actionRow = new ActionRowBuilder().addComponents(registerBtn);

    try {
        await channel.send({ 
            content: `👋 ยินดีต้อนรับ \${member}! รบกวนกดปุ่มด้านล่างนี้เพื่อกรอกข้อมูลเข้าชมรมน้าา 👇`, 
            components: [actionRow] 
        });
    } catch (error) {
        console.error(`❌ Failed to send welcome message to \${member.user.tag}:`, error);
    }
});

// =====================================================================
// Event: Interaction Create
// =====================================================================
client.on(Events.InteractionCreate, async (interaction) => {
    
    // -----------------------------------------------------------------
    // Step 1: Registration Button Clicked -> Show Camp Selection Menu
    // -----------------------------------------------------------------
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

        const actionRow = new ActionRowBuilder().addComponents(campSelectMenu);

        return await interaction.reply({ 
            content: 'กรุณาเลือกค่าย+ปี หรือศิษย์เก่า แล้วกรอกชื่อเล่นในขั้นตอนถัดไป', 
            components: [actionRow],
            ephemeral: true
        });
    }

    // -----------------------------------------------------------------
    // Step 2: Camp Selected -> Show Modal for Nickname Input
    // -----------------------------------------------------------------
    if (interaction.isStringSelectMenu() && interaction.customId === 'camp_select_menu') {
        const selectedCamp = interaction.values[0];
        
        const modal = new ModalBuilder()
            .setCustomId(`register_modal:\${selectedCamp}`)
            .setTitle('ฟอร์มลงทะเบียนชมรมอนุรักษ์');

        const nicknameInput = new TextInputBuilder()
            .setCustomId('name_input')
            .setLabel('ตั้งชื่อค้าบ')
            .setPlaceholder('กรอกชื่อเล่นของคุณ เช่น เซ่นซีวิก')
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

    // -----------------------------------------------------------------
    // Step 3: Modal Submitted -> Rename, Give Base Role, Show Gang Menu
    // -----------------------------------------------------------------
    if (interaction.isModalSubmit() && interaction.customId.startsWith('register_modal:')) {
        const selectedCamp = interaction.customId.split(':')[1];
        const nickname = interaction.fields.getTextInputValue('name_input');
        
        const prefix = selectedCamp === 'alumni'
            ? interaction.fields.getTextInputValue('grad_year_input')
            : selectedCamp === 'ดูนก'
                ? 'ดูนก'
                : selectedCamp;

        // 💡 เลือกรูปแบบชื่อที่ต้องการใช้งาน:
        // รูปแบบที่ 1: มีชื่อค่ายนำหน้า เช่น [กุยบุรี 67] เซ่นซีวิก
        const newNickname = `[${prefix}]${nickname}`.slice(0, 32);

        // รูปแบบที่ 2: แสดงเฉพาะชื่อเล่นอย่างเดียว (หากต้องการใช้แบบนี้ ให้ลบ // ด้านหน้าบรรทัดล่างสุดนี้ออก)
        // const newNickname = nickname.slice(0, 32);

        try {
            // อัปเดตชื่อเล่น
            await interaction.member.setNickname(newNickname);

            // มอบยศเริ่มต้น (ถ้ามี ROLE_ID กำหนดใน .env)
            if (process.env.ROLE_ID) {
                await interaction.member.roles.add(process.env.ROLE_ID);
            }

            // จัดการ Role ID และป้องกัน Value ใน Dropdown ซ้ำ/ว่างเปล่า
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
                    {
                        label: 'แก๊งค์อนุรักษ์69',
                        description: 'สมาชิกปีการศึกษา69',
                        value: role1
                    },
                    {
                        label: 'แก๊งค์พี่กระทิง(ศิษย์เก่า)',
                        description: 'ศิษย์เก่า and the gang',
                        value: role2 !== role1 ? role2 : `\${role2}_fallback`
                    },
                    {
                        label: 'แก๊งค์บอด69',
                        description: 'ลู้มือ',
                        value: role3 !== role1 && role3 !== role2 ? role3 : `\${role3}_fallback`
                    },
                    {
                        label: 'ดูนก',
                        description: 'ให้ยศดูนก',
                        value: role4 !== role1 && role4 !== role2 && role4 !== role3 ? role4 : `\${role4}_fallback`
                    }
                );

            const actionRow = new ActionRowBuilder().addComponents(gangSelectMenu);

            return await interaction.reply({ 
                content: `✅ เปลี่ยนชื่อเป็น **\${newNickname}** เรียบร้อย!\n\n**ขั้นตอนสุดท้าย:** แก๊งค์ไหนอะเรา จิ้มๆเลือกมาซิ👇`, 
                components: [actionRow],
                ephemeral: true 
            });

        } catch (error) {
            console.error('❌ Error during Step 3:', error);
            return await interaction.reply({ 
                content: `❌ เกิดข้อผิดพลาดในการเปลี่ยนชื่อ: \`${error.message}\``, 
                ephemeral: true 
            });
        }
    }

    // -----------------------------------------------------------------
    // Step 4: Gang Selected -> Assign Roles and Finalize
    // -----------------------------------------------------------------
    if (interaction.isStringSelectMenu() && interaction.customId === 'role_select_menu') {
        try {
            // กรองเอาเฉพาะ ID ยศที่ถูกต้อง
            const selectedRoles = interaction.values.filter(roleId => !roleId.includes('_fallback') && !roleId.startsWith('role_'));
            
            if (selectedRoles.length > 0) {
                await interaction.member.roles.add(selectedRoles);
            }

            return await interaction.update({ 
                content: '🎉 ยืนยันตัวตนสมบูรณ์! เข้าไปพูดคุยในห้องต่างๆ ได้เลยย', 
                components: [] 
            });
        } catch (error) {
            console.error('❌ Error assigning gang roles:', error);
            return await interaction.followUp({ 
                content: `❌ เกิดข้อผิดพลาดในการมอบยศ: \`${error.message}\``, 
                ephemeral: true 
            });
        }
    }
});

// =====================================================================
// Discord Client Login
// =====================================================================
client.login(process.env.BOT_TOKEN).catch(error => {
    console.error('❌ Failed to login to Discord. Please check your BOT_TOKEN:', error.message);
});

// =====================================================================
// Health Check Server (Keep-alive for Render/Hosting)
// =====================================================================
const http = require('http');
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive and running!\n');
}).listen(PORT, () => {
    console.log(`🌐 Health check server listening on port ${PORT}`);
});
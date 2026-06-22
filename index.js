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
// Event: Client Ready
// Triggered once when the bot successfully logs in.
// =====================================================================
client.once(Events.ClientReady, async (readyClient) => {
    console.log(`✅ Bot ${readyClient.user.tag} is online and ready!`);
    console.log(`🔎 Checking channel ${process.env.CHANNEL_ID} for the registration button...`);

    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) {
        return console.error('❌ Channel not found. Please verify CHANNEL_ID in the .env file.');
    }

    // Create the registration button
    const registerBtn = new ButtonBuilder()
        .setCustomId('register_btn')
        .setLabel('คลิกเพื่อลงทะเบียนเข้าชมรม')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🌿');

    const actionRow = new ActionRowBuilder().addComponents(registerBtn);

    try {
        // Fetch recent messages to check if the button already exists
        const messages = await channel.messages.fetch({ limit: 10 });
        const hasButton = messages.some(msg => msg.components.length > 0);

        // Send the button only if it doesn't exist to prevent spam
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
// Triggered when a new user joins the server.
// =====================================================================
client.on(Events.GuildMemberAdd, async (member) => {
    console.log(`📥 GuildMemberAdd event triggered for: ${member.user.tag}`);
    
    const channel = member.guild.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) return;

    const registerBtn = new ButtonBuilder()
        .setCustomId('register_btn')
        .setLabel('คลิกเพื่อลงทะเบียนเข้าชมรม')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🌿');

    const actionRow = new ActionRowBuilder().addComponents(registerBtn);

    try {
        // Ping the new member and provide the registration button
        await channel.send({ 
            content: `👋 ยินดีต้อนรับ ${member}! รบกวนกดปุ่มด้านล่างนี้เพื่อกรอกข้อมูลเข้าชมรมน้าา 👇`, 
            components: [actionRow] 
        });
    } catch (error) {
        console.error(`❌ Failed to send welcome message to ${member.user.tag}:`, error);
    }
});

// =====================================================================
// Event: Interaction Create
// Handles all Buttons, Select Menus, and Modal submissions.
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
        
        // Pass the selected camp via the modal's customId
        const modal = new ModalBuilder()
            .setCustomId(`register_modal:${selectedCamp}`)
            .setTitle('ฟอร์มลงทะเบียนชมรมอนุรักษ์');

        const nicknameInput = new TextInputBuilder()
            .setCustomId('name_input')
            .setLabel('ชื่อเล่น / ชื่อที่ต้องการให้ตั้ง')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(nicknameInput));

        // Dynamically add graduation year input if 'alumni' is selected
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
        
        // Determine the prefix based on alumni vs current student
        const prefix = selectedCamp === 'alumni'
            ? interaction.fields.getTextInputValue('grad_year_input')
            : selectedCamp;
            
        const newNickname = `[${prefix}] ${nickname}`;

        try {
            // Update nickname and assign base role
            await interaction.member.setNickname(newNickname);
            await interaction.member.roles.add(process.env.ROLE_ID);

            const gangSelectMenu = new StringSelectMenuBuilder()
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

            const actionRow = new ActionRowBuilder().addComponents(gangSelectMenu);

            return await interaction.reply({ 
                content: `✅ เปลี่ยนชื่อเป็น **${newNickname}** เรียบร้อย!\n\n**ขั้นตอนสุดท้าย:** แก๊งค์ไหนอะเรา จิ้มๆเลือกมาซิ👇`, 
                components: [actionRow],
                ephemeral: true 
            });

        } catch (error) {
            console.error('❌ Error during renaming or base role assignment:', error);
            return await interaction.reply({ 
                content: '❌ เกิดข้อผิดพลาดในการเปลี่ยนชื่อ กรุณาติดต่อ Admin ครับ', 
                ephemeral: true 
            });
        }
    }

    // -----------------------------------------------------------------
    // Step 4: Gang Selected -> Assign Roles and Finalize
    // -----------------------------------------------------------------
    if (interaction.isStringSelectMenu() && interaction.customId === 'role_select_menu') {
        try {
            const selectedRoles = interaction.values;
            await interaction.member.roles.add(selectedRoles);

            return await interaction.update({ 
                content: '🎉 ยืนยันตัวตนสมบูรณ์! เข้าไปพูดคุยในห้องต่างๆ ได้เลยย', 
                components: [] // Remove the dropdown menu
            });
        } catch (error) {
            console.error('❌ Error assigning gang roles:', error);
            return await interaction.followUp({ 
                content: '❌ เกิดข้อผิดพลาดในการมอบยศ กรุณาติดต่อ Admin ครับ', 
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
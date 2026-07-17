(() => {
  const wizardData = {
    name: "王小明",
    email: "test@example.com",
    phone: "bypass",
    whatsapp: "bypass",
    preferredContact: "email",
    answers: {
      industry: "餐飲",
      brandName: "日出咖啡 Sunrise Brew",
      brandTone: "溫馨、專業、社區感",
      styleRequirements: "簡約、溫暖、現代",
      language: "繁體中文",
      sellingPoints: "手沖單品咖啡、專業咖啡師、溫馨空間",
      targetAudience: "25-45歲城市白領、咖啡愛好者",
      siteContactMethod: "電子郵件、WhatsApp",
      forbiddenWords: "無",
      additionalNotes: "無"
    },
    honeypot: ""
  };
  localStorage.setItem('yoware_wizard_landing-v1', JSON.stringify(wizardData));
  return { saved: true, key: 'yoware_wizard_landing-v1' };
})()

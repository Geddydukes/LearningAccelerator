// Simple test to check if prompts are accessible
const testPrompts = async () => {
  try {
    // Test CLO prompt access
    const response = await fetch('https://jclgmvbkrlkppecwnljv.supabase.co/storage/v1/object/public/agent-prompts/clo_v3.yml');
    
    if (response.ok) {
      const content = await response.text();
      console.log('✅ CLO prompt accessible, length:', content.length);
      console.log('First 200 chars:', content.substring(0, 200));
    } else {
      console.log('❌ CLO prompt not accessible:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Error accessing CLO prompt:', error.message);
  }
};

testPrompts();

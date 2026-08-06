function prefillTypeFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  if (!type) return;
  const select = document.getElementById('f-type');
  const match = Array.from(select.options).find((o) => o.value.toLowerCase() === type.toLowerCase());
  if (match) select.value = match.value;
}

function showStatus(message, isError) {
  const el = document.getElementById('form-status');
  el.className = isError ? 'form-error' : 'form-success';
  el.textContent = message;
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('form-submit');
  const statusEl = document.getElementById('form-status');
  statusEl.className = '';
  statusEl.textContent = '';

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    type: form.type.value,
    message: form.message.value.trim(),
    website: form.website.value // honeypot
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    form.reset();
    showStatus("Thank you! We've received your message and will get back to you soon.", false);
  } catch (err) {
    showStatus(err.message, true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  }
}

(async function init() {
  prefillTypeFromQuery();
  document.getElementById('inquiry-form').addEventListener('submit', handleSubmit);
  try {
    const settings = await loadSettings();
    renderChrome(settings);
    const programsRes = await fetch('/api/programs');
    if (programsRes.ok) renderFooterPrograms(await programsRes.json());
  } catch (err) {
    console.error(err);
  }
})();

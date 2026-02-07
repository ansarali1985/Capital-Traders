
import React, { useState } from 'react';
import { BusinessInfo } from '../types';

interface ContactUsProps {
  businessInfo: BusinessInfo;
  themeColor: string;
}

const ContactUs: React.FC<ContactUsProps> = ({ businessInfo, themeColor }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    type: 'Tyre Availability',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Please fill in your name and phone number.');
      return;
    }

    // Fixed Pakistan Number Cleaning Logic
    let cleanNumber = businessInfo.whatsapp.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '92' + cleanNumber.substring(1);
    } else if (!cleanNumber.startsWith('92')) {
      cleanNumber = '92' + cleanNumber;
    }

    const whatsappMessage = encodeURIComponent(
      `*New Quote Request*\n\n` +
      `*Name:* ${formData.name}\n` +
      `*Phone:* ${formData.phone}\n` +
      `*Type:* ${formData.type}\n` +
      `*Details:* ${formData.message}\n\n` +
      `Sent via Capital Traders Website`
    );

    window.open(`https://wa.me/${cleanNumber}?text=${whatsappMessage}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-16 animate-fadeIn">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter uppercase">CONTACT US</h1>
        <p className="text-gray-500 max-w-lg mx-auto font-medium">Have questions or need a custom quote? Reach out to us directly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-start gap-6">
            <div className={`bg-gradient-to-br ${themeColor} p-4 rounded-2xl text-white shadow-lg`}>
              <i className="fas fa-map-marker-alt text-2xl"></i>
            </div>
            <div>
              <h3 className="font-black text-xl mb-2 uppercase tracking-tight">Our Location</h3>
              <p className="text-gray-500 font-medium leading-relaxed">{businessInfo.address}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-start gap-6">
            <div className={`bg-gradient-to-br ${themeColor} p-4 rounded-2xl text-white shadow-lg`}>
              <i className="fas fa-phone-alt text-2xl"></i>
            </div>
            <div>
              <h3 className="font-black text-xl mb-2 uppercase tracking-tight">Phone & Support</h3>
              <p className="text-gray-900 font-bold">{businessInfo.phone}</p>
              <p className="text-gray-500 text-sm">Mon - Sat: 9:00 AM - 8:00 PM</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-start gap-6">
            <div className={`bg-gradient-to-br ${themeColor} p-4 rounded-2xl text-white shadow-lg`}>
              <i className="fab fa-whatsapp text-2xl"></i>
            </div>
            <div>
              <h3 className="font-black text-xl mb-2 uppercase tracking-tight">WhatsApp Inquiries</h3>
              <p className="text-gray-900 font-bold mb-1">{businessInfo.whatsapp}</p>
              <p className="text-gray-500 text-sm">Response time: &lt; 15 mins</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-gray-100 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-8 text-gray-900 uppercase tracking-tighter">Send a Message</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input type="text" className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-gray-900 focus:outline-none font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                  <input type="text" className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-gray-900 focus:outline-none font-bold" placeholder="0300XXXXXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Inquiry Type</label>
                <select className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-gray-900 focus:outline-none bg-white font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option>Tyre Availability</option>
                  <option>Pricing Inquiry</option>
                  <option>Service Appointment</option>
                  <option>Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Your Message</label>
                <textarea rows={4} className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-gray-900 focus:outline-none font-bold" placeholder="Tell us about your requirements..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
              </div>
              <button type="submit" className={`w-full bg-gradient-to-r ${themeColor} text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all`}>
                SEND VIA WHATSAPP
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;

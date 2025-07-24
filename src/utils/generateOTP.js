const generateOTP = () => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now
  return [otp, expiresAt];
};

module.exports = generateOTP;

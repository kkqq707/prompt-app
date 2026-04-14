/**
 * 将Supabase认证错误映射为友好的中文提示
 */
export function getAuthErrorMessage(error: { message: string; code?: string }): string {
  const { message, code } = error;

  // 基于错误消息的映射
  if (message.includes('Invalid login credentials')) {
    return '邮箱或密码错误，请检查后重试';
  }

  if (message.includes('Email not confirmed')) {
    return '邮箱未验证，请先检查您的邮箱并点击验证链接';
  }

  if (message.includes('User already registered')) {
    return '该邮箱已被注册，请直接登录或使用其他邮箱';
  }

  if (message.includes('Password should be at least')) {
    return '密码长度不足，请至少使用6位字符';
  }

  if (message.includes('Invalid email')) {
    return '邮箱格式不正确，请检查后重试';
  }

  if (message.includes('User not found')) {
    return '用户不存在，请检查邮箱或注册新账号';
  }

  if (message.includes('Too many requests')) {
    return '请求过于频繁，请稍后再试';
  }

  if (message.includes('Network error') || message.includes('Failed to fetch')) {
    return '网络连接失败，请检查网络后重试';
  }

  // 重置密码相关错误
  if (message.includes('Password reset required')) {
    return '需要重置密码，请通过忘记密码功能重置';
  }

  if (message.includes('invalid or expired')) {
    return '链接无效或已过期，请重新发送重置邮件';
  }

  if (message.includes('Email rate limit exceeded')) {
    return '邮件发送过于频繁，请稍后再试';
  }

  if (message.includes('Weak password')) {
    return '密码强度不足，请使用更复杂的密码';
  }

  // 基于错误代码的映射
  if (code === 'invalid_credentials') {
    return '邮箱或密码错误，请检查后重试';
  }

  if (code === 'email_not_confirmed') {
    return '邮箱未验证，请先检查您的邮箱并点击验证链接';
  }

  if (code === 'user_already_exists') {
    return '该邮箱已被注册，请直接登录或使用其他邮箱';
  }

  // 默认返回原始错误消息
  return `操作失败：${message}`;
}
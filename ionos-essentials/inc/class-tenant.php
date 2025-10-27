<?php

namespace ionos\essentials;

/*
  utility class to get precomputed tenant information
 */

defined('ABSPATH') || exit();

class Tenant
{
  /**
   * @readonly
   */
  private string $_slug;
  /**
   * @readonly
   */
  private string $_label;

  private static ?Tenant $instance = null;

  private function __construct(string $_slug)
  {
      $this->_slug = $_slug;
      switch ($_slug) {
          case 'ionos':
              $this->_label = 'IONOS';
              break;
          case 'fasthosts':
              $this->_label = 'Fasthosts';
              break;
          case 'homepl':
              $this->_label = 'home.pl';
              break;
          case 'arsys':
              $this->_label = 'Arsys';
              break;
          case 'piensa':
              $this->_label = 'Piensa Solutions';
              break;
          case 'strato':
              $this->_label = 'STRATO';
              break;
          case 'udag':
              $this->_label = 'United Domains';
              break;
          default:
              $this->_label = 'IONOS';
              break;
      }
  }

  public static function get_slug(): string
  {
    return self::_get_instance()->_slug;
  }

  public static function get_label(): string
  {
    return self::_get_instance()->_label;
  }

  private static function _get_instance(): self
  {
    if (! self::$instance instanceof self) {
      self::$instance = new self(strtolower(\get_option('ionos_group_brand', 'ionos')));
    }

    return self::$instance;
  }
}
